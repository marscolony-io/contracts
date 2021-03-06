const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AvatarManager = artifacts.require("AvatarManager");
const CryochamberManager = artifacts.require("CryochamberManager");

const MCL = artifacts.require("MartianColonists");
const GM = artifacts.require("GameManager");

module.exports = async (deployer, network, [DAO, treasury, liquidity]) => {
  const _MCL = await MCL.deployed();
  const _AvatarManager = await AvatarManager.deployed();

  await deployProxy(
    CryochamberManager,
    [DAO, _MCL.address, _AvatarManager.address],
    {
      deployer,
    }
  );

  const _CRYO = await CryochamberManager.deployed();

  let _GM;
  if (network === "development") {
    await _AvatarManager.setCryochamberManager(_CRYO.address);
    _GM = await GM.deployed();
  } else if (network === "hartest") {
    // await _AvatarManager.setGameManager(
    //   "0xc65F8BA708814653EDdCe0e9f75827fe309E29aD"
    // );
    // _GM = await GM.at("0xc65F8BA708814653EDdCe0e9f75827fe309E29aD");
  } else {
    // // harmain
    // await _AvatarManager.setGameManager(
    //   "0x0D112a449D23961d03E906572D8ce861C441D6c3"
    // );
    // _GM = await GM.at("0x0D112a449D23961d03E906572D8ce861C441D6c3");
  }

  await _GM.setCryochamberAddress(_CRYO.address);
  await _CRYO.setGameManager(_GM.address);
};
