const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const GM = artifacts.require("GameManager");
const LBX = artifacts.require("Lootboxes");

module.exports = async (deployer, network, [DAO, treasury, liquidity]) => {
  await deployer.deploy(LBX, "");
  const _LBX = await LBX.deployed();

  if (network === "hartest" || network === "development") {
    await _LBX.setGameManager(GM.address);
  } else if (network === "hartest") {
    await _LBX.setGameManager("0xc65F8BA708814653EDdCe0e9f75827fe309E29aD");
  } else {
    // harmain
    await _LBX.setGameManager("0x0D112a449D23961d03E906572D8ce861C441D6c3");
  }
};
