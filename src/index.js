const MakeMqClient = require('./clients/MqClient');
const MakeMqService = require('./clients/MqService');

module.exports = (app) => {
  app.register('Client', 'MqClient', MakeMqClient);
  app.register('Service', 'MqService', MakeMqService);

  return app;
};
