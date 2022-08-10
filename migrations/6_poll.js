const GameManagerFixed = artifacts.require("GameManagerFixed");
const Poll = artifacts.require("Poll");

module.exports = async (deployer, network, addresses) => {
  let gm;
  if (network === 'development') {
    gm = await GameManagerFixed.deployed();
  } else {
    gm = await GameManagerFixed.at('0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797');
    // TODO different for other networks
  }

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
  await poll.setGameManager(gm.address);

  await gm.setPollAddress(poll.address);
};
