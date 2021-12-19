const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');
const GameManager = artifacts.require('GameManager');

module.exports = async (deployer, network, addresses) => {
  await Promise.all([
    deployer.deploy(CLNY, addresses[0]),
    deployer.deploy(MC, addresses[0], 'https://meta.marscolony.io/'),
  ]);
  await deployer.deploy(GameManager, addresses[0], CLNY.address, MC.address);

  const _MC = await MC.deployed();
  const _CLNY = await CLNY.deployed();

  await Promise.all([
    _CLNY.setGameManager(GameManager.address),
    _MC.setGameManager(GameManager.address),
  ]);
};
