const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');
const GameManager = artifacts.require('GameManager');

module.exports = async (deployer, network, [DAO, treasury, liquidity]) => {
  await deployProxy(CLNY, [DAO], { deployer });
  await deployProxy(MC, [DAO, 'https://meta.marscolony.io/'], { deployer });
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

  console.log("INITTTTTT");
  await Promise.all([
    _CLNY.setGameManager(GameManager.address),
    _MC.setGameManager(GameManager.address),
  ]);

  console.log({
    GP: GameManager.address,
    MC: MC.address,
    CLNY: CLNY.address,
  });

  // TODO move DAO to particular addresses for real networks
};
