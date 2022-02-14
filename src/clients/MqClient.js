const amqp = require('amqplib');

module.exports = ({ Core: { Config: { mq: { hostname, username, password } } } }) => {
  return amqp.connect({ hostname, username, password });
};
