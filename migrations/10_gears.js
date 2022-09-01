const GameManagerFixed = artifacts.require("GameManagerFixed");
const GameManagerShares = artifacts.require("GameManagerShares");
const GEARS = artifacts.require("Gears");
const MCL = artifacts.require("MartianColonists");
const CM = artifacts.require("CollectionManager");

module.exports = async (deployer, network) => {
  let _CM;

  await deployer.deploy(GEARS, "https://gears-harmony.marscolony.io/");
  const _GEARS = await GEARS.deployed();

  if (network === "development") {
    await _GEARS.setCollectionManager(CM.address);
    _CM = await CM.deployed();
  } else {
    // harmain
    await _GEARS.setCollectionManager(
      "0xCc55065afd013CF06f989448cf724fEC4fF29626"
    );
    _CM = await CM.at("0xCc55065afd013CF06f989448cf724fEC4fF29626");
  }

  await _CM.setGearsAddress(_GEARS.address);
};
