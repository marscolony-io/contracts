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
  if (network === 'hartest') {
    return; // this file for manual migrations; pass in tests
  }
  const gm = await GM.deployed();

  await deployer.deploy(
    Poll,
    addresses[0],
    'Community voting',
    'Fixed or Dynamic? When should Polygon web3 society (MarsColony Mainnet) be launched? [See details of each proposal](https://people.marscolony.io/t/polygon-launch-proposal-details/4827). Eligible to vote: Polygon NFT owners. Voting power: 1 NFT - 1 VOTE',
    [
      'Fixed date: launch Mainnet on June 16, 2022 (start pCLNY emissions, enable MC land transfers)',
      'Flexible Date: launch Mainnet only after all 21k NFTs will be claimed',
    ],
  );
  const poll = await Poll.deployed();
  await poll.setGameManager(GM.address);

  // await gm.setPollAddress(Poll.address);
};
