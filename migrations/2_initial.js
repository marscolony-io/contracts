const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const MC = artifacts.require("MC");
const CLNY = artifacts.require("CLNY");
const GameManagerFixed = artifacts.require("GameManagerFixed");
const GameManagerShares = artifacts.require("GameManagerShares");

module.exports = async (deployer, network, [, , , , , , treasury, liquidity]) => {
  await deployer.deploy(CLNY, 'CLNY');
  await deployer.deploy(
    MC,
    {
      fuji: 'https://meta-test.marscolony.io/',
      harmain: 'https://meta.marscolony.io/',
      polygon: 'https://meta-polygon.marscolony.io/',
      development: 'https://meta.marscolony.io/'
    }[network] ?? '',
  );

  const mc = await MC.deployed();
  const clny = await CLNY.deployed();

  if (['development', 'fuji', 'harmony'].includes(network)) {
    await deployProxy(
      GameManagerFixed,
      [CLNY.address, MC.address, treasury, liquidity],
      { deployer }
    );
    await clny.setGameManager(GameManagerFixed.address);
    await mc.setGameManager(GameManagerFixed.address);
  }
  if (['development', 'fuji', 'harmony'].includes(network)) {
    await deployProxy(
      GameManagerShares,
      [CLNY.address, MC.address, treasury, liquidity],
      { deployer }
    );
    if (network !== 'development') {
      await clny.setGameManager(GameManagerShares.address);
      await mc.setGameManager(GameManagerShares.address);
    }
  }

  // only for polygon share economy
  // ??? await _CLNY.approve(GameManager.address, '115792089237316195423570985008687907853269984665640564039457584007913129639935');
};
