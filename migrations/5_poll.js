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
const fs = require('fs');

module.exports = async (deployer, network, addresses) => {
  if (network === 'development') {
    return; // this file for manual migrations; pass in tests
  }
  let landlords = fs.readFileSync('./landlords.txt', 'utf-8').split('\n').map(lord => lord.trim()).filter(lord => lord.length > 5);
  if (network !== 'harmain') {
    const [ , , ...accountsExceptFirstTwo] = addresses;
    landlords = [...landlords, ...accountsExceptFirstTwo]; // for tests
  }
  await deployer.deploy(
    Poll,
    addresses[0],
    'Shall we go to Polygon today? https://people.marscolony.io/t/colony-tokenomic/53',
    ['Yes', 'No', 'Maybe'],
  );
  const poll = await Poll.deployed();
  const gm = await GM.at('0xc65F8BA708814653EDdCe0e9f75827fe309E29aD');
  await gm.setPollAddress(poll.address);
  // TODO add whitelisted addresses
};
