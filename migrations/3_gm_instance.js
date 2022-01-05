/**
 * Empty migration used to deploy instances to upgrade manually
 * ```
 * truffle deploy --network hartest -f 3 --to 3
 * ```
 */

const GameManager = artifacts.require('GameManager');

module.exports = async (deployer, network, addresses) => {
  // await deployer.deploy(GameManager);
};
