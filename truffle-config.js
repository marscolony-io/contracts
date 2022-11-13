const { mnemonic, mumbai_node_key } = require("./secrets.json");
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*",
      defaultEtherBalance: 10000,
    },
    develop: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*",
      defaultEtherBalance: 10000,
    },
    harmony: {
      provider: () => {
        return new HDWalletProvider({
          mnemonic: mnemonic.harmain,
          providerOrUrl: "https://rpc.ankr.com/harmony", // 'https://api.fuzz.fi', // 'https://api.harmony.one',
          derivationPath: `m/44'/60'/0'/0/`,
          confirmations: 0,
          timeoutBlocks: 200,
        });
      },
      network_id: 1666600000,
      gasPrice: 110 * 1e9,
    },
    fuji: {
      provider: () => {
        return new HDWalletProvider({
          mnemonic: mnemonic.harmain,
          providerOrUrl: "https://api.avax-test.network/ext/bc/C/rpc",
          derivationPath: `m/44'/60'/0'/0/`,
          confirmations: 0,
          timeoutBlocks: 200,
        });
      },
      network_id: 43113,
      gasPrice: 30 * 1e9,
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
      gasPrice: 110 * 1e9,
      maxGasFees: 110 * 1e9,
      maxPriorityFees: 60 * 1e9,
      // gas: 5000000
    },
    mumbai: {
      provider: () => {
        return new HDWalletProvider({
          mnemonic: mnemonic.mumbai,
          providerOrUrl: 'https://polygon-mumbai.g.alchemy.com/v2/' + mumbai_node_key,
          derivationPath: `m/44'/60'/0'/0/`,
          confirmations: 0,
          timeoutBlocks: 200,
          networkCheckTimeout: 200000,
        });
      },
      // gas: 2600000,
      network_id: 80001,
      gasPrice: 13 * 1e9,
      maxGasFees: 33 * 1e9,
      maxPriorityFees: 34 * 1e9,
    },
  },
  compilers: {
    solc: {
      version: "0.8.13",
      settings: {
        optimizer: {
          enabled: true,
          runs: 10,
        },
      },
    },
  },
  plugins: ["solidity-coverage"],
};
