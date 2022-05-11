/**
 * Empty migration used to deploy instances to upgrade manually
 * ```
 * truffle deploy --network hartest -f 3 --to 3
 * ```
 */

const GM = artifacts.require('GameManager');
const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');
const MartianColonists = artifacts.require('MartianColonists');
const Poll = artifacts.require('Poll');

module.exports = async (deployer, network, addresses) => {
  if (network === 'development') {
    return; // this file for manual migrations; pass in tests
  }
  console.log({ADDRESS:addresses[0]});
  const inst = await deployer.deploy(MartianColonists, 'https://meta-mumbai.marscolony.io/');
};
