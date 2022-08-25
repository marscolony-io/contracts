const GameManagerFixed = artifacts.require("GameManagerFixed");
const GameManagerShares = artifacts.require("GameManagerShares");
const GEARS = artifacts.require("Gears");
const MCL = artifacts.require("MartianColonists");
const CM = artifacts.require("CollectionManager");

module.exports = async (deployer, network) => {
  let _CM;

  await deployer.deploy(GEARS, "");
  const _GEARS = await GEARS.deployed();

  if (network === "development") {
    await _GEARS.setCollectionManager(CM.address);
    _CM = await CM.deployed();
  } else {
    // harmain
    await _GEARS.setCollectionManager(
      "0x0D112a449D23961d03E906572D8ce861C441D6c3"
    );
    _CM = await CM.at("");
  }

  await _CM.setGearsAddress(_GEARS.address);
};
