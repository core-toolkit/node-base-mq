
const supportedVendors = ['rabbitmq'];

module.exports = ({ vendor }, { addToConfig, addAppToRoot }) => {
  if (!supportedVendors.includes(vendor)) {
    throw new Error(`Unsupported vendor ${vendor}, must be one of: [${supportedVendors.join(', ')}]`);
  }

  addToConfig('mq:config.js', { vendor });
  addAppToRoot('Mq');
};
