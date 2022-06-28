const { projectId, key, mnemonic } = require("./secrets.json");
const PrivateKeyProvider = require("truffle-privatekey-provider");
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
    // ropsten: {
    //   provider: new PrivateKeyProvider(
    //     key,
    //     `https://ropsten.infura.io/v3/${projectId}`
    //   ),
    //   network_id: 3, // Ropsten's id
    //   gas: 5500000, // Ropsten has a lower block limit than mainnet
    //   confirmations: 0, // # of confs to wait between deployments. (default: 0)
    //   timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
    //   skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
    // },
    // rinkeby: {
    //   provider: new PrivateKeyProvider(
    //     key,
    //     `https://rinkeby.infura.io/v3/${projectId}`
    //   ),
    //   network_id: 4, // Rinkeby's id
    //   gas: 4500000, // Ropsten has a lower block limit than mainnet
    //   confirmations: 0, // # of confs to wait between deployments. (default: 0)
    //   timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
    //   skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
    // },
    bsct: {
      // binance smart chain test
      provider: () =>
        new HDWalletProvider(
          mnemonic.bsct,
          `https://data-seed-prebsc-1-s1.binance.org:8545`
        ),
      network_id: 97,
      confirmations: 0,
      timeoutBlocks: 200,
      skipDryRun: true,
      gasPrice: 11 * 10 ** 9,
      networkCheckTimeout: 10000,
    },
    bsc: {
      provider: () =>
        new HDWalletProvider(mnemonic.bsc, `https://bsc-dataseed1.binance.org`),
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
          providerOrUrl: "https://api.s0.b.hmny.io",
          derivationPath: `m/44'/60'/0'/0/`,
        });
      },
      network_id: 1666700000,
    },
    harmain: {
      provider: () => {
        return new HDWalletProvider({
          mnemonic: mnemonic.harmain,
          providerOrUrl: "https://rpc.hermesdefi.io", // 'https://api.fuzz.fi', // 'https://api.harmony.one',
          derivationPath: `m/44'/60'/0'/0/`,
          confirmations: 0,
          timeoutBlocks: 200,
        });
      },
      network_id: 1666600000,
      gasPrice: 40 * 1e9,
    },
    avatest: {
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
