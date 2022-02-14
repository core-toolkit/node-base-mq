const MakeMqClient = require('./clients/MqClient');

module.exports = (app) => {
  app.register('Client', 'MqClient', MakeMqClient);

  return app;
};
