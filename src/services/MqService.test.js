const MqService = require('./MqService');

const channel = {
  assertQueue: jest.fn((queue) => ({ queue })),
  assertExchange: jest.fn((exchange) => ({ exchange })),
  bindQueue: jest.fn(),
  consume: jest.fn(),
  publish: jest.fn(),
  close: jest.fn(),
};

const context = {
  Core: { Config: { mq: { prefix: 'foo-' } } },
  Client: { MqClient: { createChannel: jest.fn(() => channel) } },
  Log: { w: jest.fn() },
};

describe('MqService', () => {
  beforeEach(() => Object.keys(channel).forEach((method) => channel[method].mockClear()));

  it('makes a MqService', async () => {
    const service = await MqService(context);
    expect(service).toBeInstanceOf(Object);
    expect(channel.assertQueue).toHaveBeenCalledWith('foo-queue', expect.any(Object));
    expect(channel.assertExchange).toHaveBeenCalledWith('foo-exchange', 'fanout');
    expect(channel.consume).toHaveBeenCalledWith('foo-queue', expect.any(Function), expect.any(Object));
  });

  describe('.addListener()', () => {
    it('attached listeners receive messages', async () => {
      const service = await MqService(context);
      const [[, publish]] = channel.consume.mock.calls;
      const mock1 = jest.fn();
      const mock2 = jest.fn();

      service.addListener(mock1);
      publish({ fields: { routingKey: 'bar' }, content: Buffer.from('{"baz": 123}') });
      expect(mock1).toHaveBeenCalledWith('bar', expect.objectContaining({ baz: 123 }));

      service.addListener(mock2);
      publish({ fields: { routingKey: 'bar' }, content: Buffer.from('{"baz": 456}') });
      expect(mock1).toHaveBeenCalledWith('bar', expect.objectContaining({ baz: 456 }));
      expect(mock2).toHaveBeenCalledWith('bar', expect.objectContaining({ baz: 456 }));
    });

    it("attached listeners don't receive cancelled messages", async () => {
      const mock = jest.fn();
      const service = await MqService(context);
      const [[, publish]] = channel.consume.mock.calls;

      service.addListener(mock);
      publish(null);
      expect(mock).not.toHaveBeenCalled();
    });

    it("attached listeners don't receive malformed messages", async () => {
      const mock = jest.fn();
      const service = await MqService(context);
      const [[, publish]] = channel.consume.mock.calls;

      service.addListener(mock);
      publish({ fields: { routingKey: 'bar' }, content: Buffer.from('{"baz: 123]') });
      expect(mock).not.toHaveBeenCalled();
    });
  });

  describe('.bind', () => {
    it('binds an exchange to its own queue for a routing key', async () => {
      const service = await MqService(context);
      await service.bind('bar', 'baz');
      expect(channel.bindQueue).toHaveBeenCalledWith('foo-queue', 'bar', 'baz');
    });

    it('binds an exchange to its own queue for all routing keys', async () => {
      const service = await MqService(context);
      await service.bind('bar');
      expect(channel.bindQueue).toHaveBeenCalledWith('foo-queue', 'bar', '*');
    });
  });

  describe('.publish()', () => {
    it('publishes data to its own exchange', async () => {
      const service = await MqService(context);
      await service.publish('bar', { baz: 123 });
      expect(channel.publish).toHaveBeenCalledWith('foo-exchange', 'bar', expect.any(Buffer));
      expect(channel.publish.mock.lastCall[2].toString()).toBe('{"baz":123}');
    });
  });

  describe('.close()', () => {
    it('closes the underlying channel', async () => {
      const service = await MqService(context);
      expect(channel.close).not.toHaveBeenCalled();
      await service.close();
      expect(channel.close).toHaveBeenCalled();
    });
  });
});
