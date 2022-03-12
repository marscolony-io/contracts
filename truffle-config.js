const { projectId, key, mnemonic } = require('./secrets.json');
const PrivateKeyProvider = require('truffle-privatekey-provider');
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*"
    },
    develop: {
      host: "127.0.0.1",
      port: 9545,
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
    bsct: { // binance smart chain test
      provider: () => new HDWalletProvider(mnemonic.bsct, `https://data-seed-prebsc-1-s1.binance.org:8545`),
      network_id: 97,
      confirmations: 0,
      timeoutBlocks: 200,
      skipDryRun: true,
      gasPrice: 11 * 10 ** 9,
      networkCheckTimeout: 10000,
    },
    bsc: {
      provider: () => new HDWalletProvider(mnemonic.bsc, `https://bsc-dataseed1.binance.org`),
      network_id: 56,
      confirmations: 1,
      timeoutBlocks: 200,
      skipDryRun: true,
      // gasPrice: 6 * 10 ** 9,
    },
    hartest: {
      provider: () => {
        return new HDWalletProvider({
          mnemonic: mnemonic.hart,
          providerOrUrl: 'https://api.s0.b.hmny.io',
          derivationPath: `m/44'/1023'/0'/0/`
        });
      },
      network_id: 1666700000,
    },
    harmain: {
      provider: () => {
        return new HDWalletProvider({
          mnemonic: mnemonic.harmain,
          providerOrUrl: 'https://harmony-0-rpc.gateway.pokt.network', // 'https://api.harmony.one',
          derivationPath: `m/44'/60'/0'/0/`,
          confirmations: 0,
          timeoutBlocks: 200,
        });
      },
      network_id: 1666600000,
    },
  },
  compilers: {
    solc: {
      version: '0.8.5',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
  plugins: [
    'solidity-coverage',
  ],
};
