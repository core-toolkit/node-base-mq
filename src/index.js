const MqClient = require('./clients/MqClient');
const MqService = require('./services/MqService');

module.exports = (app) => {
  app.register('Client', 'MqClient', MqClient);
  app.register('Service', 'MqService', MqService);

  app.beforeStop(async ({ Client, Service }) => {
    await Service.MqService.close();
    await Client.MqClient.close();
  });

  return app;
};
