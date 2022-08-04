const GameManagerFixed = artifacts.require("GameManagerFixed");
const GameManagerShares = artifacts.require("GameManagerShares");
const LBX = artifacts.require("Lootboxes");
const MCL = artifacts.require("MartianColonists");

module.exports = async (deployer, network) => {
  let _GM;

  await deployer.deploy(LBX, "");
  const _LBX = await LBX.deployed();

  if (network === "development") {
    await _LBX.setGameManager(GameManagerFixed.address);
    _GM = await GameManagerFixed.deployed();
  } else {
    // harmain
    await _LBX.setGameManager("0x0D112a449D23961d03E906572D8ce861C441D6c3");
    _GM = await GameManagerFixed.at("0x0D112a449D23961d03E906572D8ce861C441D6c3");
  }

  await _GM.setLootboxesAddress(_LBX.address);
  await _GM.setMartianColonists(MCL.address);
};
