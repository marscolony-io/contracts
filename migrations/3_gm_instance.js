/**
 * Empty migration used to deploy instances to upgrade manually
 * ```
 * truffle deploy --network hartest -f 3 --to 3
 * ```
 */

const GM = artifacts.require('GameManager');
const CLNY = artifacts.require('CLNY');

module.exports = async (deployer, network, addresses) => {
  // const inst = await deployer.deploy(GM);
};
