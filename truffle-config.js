const { projectId, key } = require('./secrets.json');
const PrivateKeyProvider = require('truffle-privatekey-provider');

module.exports = {
  // Uncommenting the defaults below 
  // provides for an easier quick-start with Ganache.
  // You can also follow this format for other networks;
  // see <http://truffleframework.com/docs/advanced/configuration>
  // for more details on how to specify configuration options!
  //
  networks: {
   development: {
     host: "127.0.0.1",
     port: 7545,
     network_id: "*"
   },
   ropsten: {
    provider: new PrivateKeyProvider(key, `https://ropsten.infura.io/v3/${projectId}`),
    network_id: 3,       // Ropsten's id
    gas: 5500000,        // Ropsten has a lower block limit than mainnet
    confirmations: 0,    // # of confs to wait between deployments. (default: 0)
    timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
    skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
   },
   rinkeby: {
    provider: new PrivateKeyProvider(key, `https://rinkeby.infura.io/v3/${projectId}`),
    network_id: 4,       // Rinkeby's id
    gas: 4500000,        // Ropsten has a lower block limit than mainnet
    confirmations: 0,    // # of confs to wait between deployments. (default: 0)
    timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
    skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
   },
  },
  compilers: {
    solc: {
      version: '0.8.5',
    },
  },
  //
};
