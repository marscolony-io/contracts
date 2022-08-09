const GameManagerFixed = artifacts.require("GameManagerFixed");
const GameManagerShares = artifacts.require("GameManagerShares");
const GEARS = artifacts.require("Gears");
const MCL = artifacts.require("MartianColonists");

module.exports = async (deployer, network) => {
  let _GM;

  await deployer.deploy(GEARS, "");
  const _GEARS = await GEARS.deployed();

  if (network === "development") {
    await _GEARS.setGameManager(GameManagerFixed.address);
    _GM = await GameManagerFixed.deployed();
  } else {
    // harmain
    await _GEARS.setGameManager("0x0D112a449D23961d03E906572D8ce861C441D6c3");
    _GM = await GameManagerFixed.at(
      "0x0D112a449D23961d03E906572D8ce861C441D6c3"
    );
  }

  await _GM.setGearsAddress(_GEARS.address);
};
