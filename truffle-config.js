const { mnemonic } = require("./secrets.json");
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
          providerOrUrl: "https://rpc.heavenswail.one", // 'https://api.fuzz.fi', // 'https://api.harmony.one',
          derivationPath: `m/44'/60'/0'/0/`,
          confirmations: 0,
          timeoutBlocks: 200,
        });
      },
      network_id: 1666600000,
      gasPrice: 40 * 1e9,
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
      gasPrice: 200 * 1e9,
      maxGasFees: 600 * 1e9,
      maxPriorityFees: 60 * 1e9,
      gas: 5000000
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
      // gas: 500000,
      network_id: 80001,
      gasPrice: 20 * 1e9,
      maxGasFees: 60 * 1e9,
      maxPriorityFees: 70 * 1e9,
    },
  },
  compilers: {
    solc: {
      version: "0.8.11",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
  plugins: ["solidity-coverage"],
};
