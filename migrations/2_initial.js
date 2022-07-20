const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const MC = artifacts.require("MC");
const CLNY = artifacts.require("CLNY");
const GameManager = artifacts.require("GameManager");

module.exports = async (deployer, network, [DAO, treasury, liquidity]) => {
  console.log({ DAO, treasury, liquidity });
  await deployProxy(CLNY, [DAO], { deployer });
  await deployProxy(
    MC,
    [
      DAO,
      network === "hartest"
        ? "https://meta-test.marscolony.io/"
        : "https://meta.marscolony.io/",
    ],
    { deployer }
  );
  await deployProxy(
    GameManager,
    [DAO, CLNY.address, MC.address, treasury, liquidity],
    { deployer }
  );

  const _MC = await MC.deployed();
  const _CLNY = await CLNY.deployed();
  await GameManager.deployed();
  // await _MC.setSalesManager(SalesManager.address);

  await Promise.all([
    _CLNY.setGameManager(GameManager.address),
    _MC.setGameManager(GameManager.address),
  ]);
};
