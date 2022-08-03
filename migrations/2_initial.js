const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const MC = artifacts.require("MC");
const CLNY = artifacts.require("CLNY");
const GameManager = artifacts.require("GameManager");

module.exports = async (deployer, network, [owner, treasury, liquidity]) => {
  await deployer.deploy(CLNY, 'CLNY');
  await deployer.deploy(
    MC,
    network === "hartest"
      ? "https://meta-test.marscolony.io/"
      : "https://meta.marscolony.io/"
  );
  await deployProxy(
    GameManager,
    [CLNY.address, MC.address, treasury, liquidity],
    { deployer }
  );

  const _MC = await MC.deployed();
  const _CLNY = await CLNY.deployed();

  await _CLNY.setGameManager(GameManager.address);
  await _MC.setGameManager(GameManager.address);

  // only for polygon share economy
  // ??? await _CLNY.approve(GameManager.address, '115792089237316195423570985008687907853269984665640564039457584007913129639935');
};
