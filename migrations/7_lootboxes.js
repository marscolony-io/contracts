const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const MissionManager = artifacts.require("MissionManager");
const AvatarManager = artifacts.require("AvatarManager");
const GM = artifacts.require("GameManager");
const MCL = artifacts.require("MartianColonists"); // avatars NFT
const MC = artifacts.require("MC"); // land NFT
const LBX = artifacts.require("Lootboxes");

module.exports = async (deployer, network, [DAO, treasury, liquidity]) => {
  let _AvMgr;
  let _MCL;
  let _MC;
  let _GM;
  if (network === "hartest" || network === "development") {
    _AvMgr = await AvatarManager.deployed();
    _MCL = await MCL.deployed();
    _MC = await MC.deployed();
    _GM = await GM.deployed();
  } else if (network === "hartest") {
    _AvMgr = await AvatarManager.at(
      "0xdE165766CC7C48C556c8C20247b322Dd23EB313a"
    );
    _MCL = await MCL.at("0xDEfafb07765D9D0F897260BE1389743A09802F20");
    _MC = await MC.at("0xc268D8b64ce7DB6Eb8C29562Ae538005Fded299A");
  } else {
    // harmain
    _AvMgr = await AvatarManager.at(
      "0xCc55065afd013CF06f989448cf724fEC4fF29626"
    );
    _MCL = await MCL.at("0xFDCC01E0Fe5D3Fb11B922447093EE6862685616c");
    _MC = await MC.at("0x0bC0cdFDd36fc411C83221A348230Da5D3DfA89e");
  }

  await deployer.deploy(LBX, "");
  const _LBX = await LBX.deployed();

  if (network === "hartest" || network === "development") {
    await _LBX.setGameManager(GM.address);
    await _LBX.setMissionManager(MissionManager.address);
  } else if (network === "hartest") {
    await _LBX.setGameManager("0xc65F8BA708814653EDdCe0e9f75827fe309E29aD");
    // fill up mission manager address
    await _LBX.setMissionManager("");
  } else {
    // harmain
    await _LBX.setGameManager("0x0D112a449D23961d03E906572D8ce861C441D6c3");
    // fill up mission manager address
    await _LBX.setMissionManager("");
  }
};
