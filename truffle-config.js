const { mnemonic, mumbai_node_key } = require('./secrets.json');
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*"
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
      gasPrice: 40 * 1e9,
    },
    polygon: {
      provider: () => {
        return new HDWalletProvider({
          mnemonic: mnemonic.polygon,
          providerOrUrl: 'https://polygon-rpc.com',
          derivationPath: `m/44'/60'/0'/0/`,
          confirmations: 0,
          timeoutBlocks: 50,
          networkCheckTimeout: 200000,
          skipDryRun: true,
        });
      },
      network_id: 137,
      gasPrice: 300 * 1e9,
      maxGasFees: 600 * 1e9,
      maxPriorityFees: 60 * 1e9,
      gas: 5000000
    },
    mumbai: {
      provider: () => {
        return new HDWalletProvider({
          mnemonic: mnemonic.mumbai,
          providerOrUrl: 'https://matic-mumbai.chainstacklabs.com',
          // providerOrUrl: 'https://polygon-mumbai.g.alchemy.com/v2/' + mumbai_node_key,
          derivationPath: `m/44'/60'/0'/0/`,
          confirmations: 0,
          timeoutBlocks: 200,
          networkCheckTimeout: 200000,
        });
      },
      // gas: 500000,
      network_id: 80001,
      gasPrice: 20 * 1e9,
      maxGasFees: 60 * 1e9,
      maxPriorityFees: 70 * 1e9,
    },
  },
  compilers: {
    solc: {
      version: '0.8.13',
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
