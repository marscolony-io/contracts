const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');
const GameManager = artifacts.require('GameManager');

module.exports = async (deployer, network, addresses) => {
  await deployProxy(CLNY, [addresses[0]], { deployer });
  await deployProxy(MC, [addresses[0], 'https://meta.marscolony.io/'], { deployer });
  await deployProxy(GameManager, [addresses[0], CLNY.address, MC.address], { deployer });
  
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
