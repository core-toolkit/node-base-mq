const EventEmitter = require('events');

module.exports = async ({ Core: { Config: { mq: { prefix } } }, Client: { MqClient }, Log }) => {
  const ch = await MqClient.createChannel();
  const { exchange } = await ch.assertExchange(`${prefix}exchange`, 'fanout');
  const { queue } = await ch.assertQueue(`${prefix}queue`, { exclusive: true });

  const emitter = new EventEmitter();
  await ch.consume(queue, (msg) => {
    if (msg === null) {
      return;
    }
    const { fields: { routingKey }, content } = msg;
    try {
      const data = JSON.parse(content.toString());
      emitter.emit('message', routingKey, data);
    } catch (e) {
      Log.w('Cannot parse message');
    }
  }, { noAck: true });

  return {
    addListener: (handler) => emitter.addListener('message', handler),
    bind: (exchange, routingKey = '*') => ch.bindQueue(queue, exchange, routingKey),
    publish: (routingKey, data) => ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(data))),
  };
};
