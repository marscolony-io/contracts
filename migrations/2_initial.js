const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');
const GameManager = artifacts.require('GameManager');

module.exports = async (deployer, network, [DAO, treasury, liquidity]) => {
  console.log({ DAO, treasury, liquidity });
  await deployer.deploy(CLNY, DAO);
  await deployer.deploy(
    MC,
    {
      hartest: 'https://meta-test.marscolony.io/',
      harmain: 'https://meta.marscolony.io/',
      polygon: 'https://meta-polygon.marscolony.io/',
      development: 'https://meta.marscolony.io/'
    }[network] ?? '',
  );
  await deployProxy(GameManager, [
    DAO,
    CLNY.address,
    MC.address,
    treasury,
    liquidity,
  ], { deployer });
  
  const _MC = await MC.deployed();
  const _CLNY = await CLNY.deployed();
  await GameManager.deployed();

  await Promise.all([
    _CLNY.setGameManager(GameManager.address),
    _MC.setGameManager(GameManager.address),
  ]);
};
