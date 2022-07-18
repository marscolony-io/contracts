const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AvatarManager = artifacts.require("AvatarManager");
const MCL = artifacts.require("MartianColonists");
const GM = artifacts.require("GameManager");

module.exports = async (deployer, network, [DAO, treasury, liquidity]) => {
  await deployer.deploy(
    MCL,
    network === "hartest"
      ? "https://meta-avatar-test.marscolony.io/"
      : "https://meta-avatar.marscolony.io/"
  );
  await deployProxy(AvatarManager, [DAO, MCL.address], { deployer });
  const _MCL = await MCL.deployed();
  await _MCL.setAvatarManager(AvatarManager.address);

  const _AvatarManager = await AvatarManager.deployed();
  let _GM;
  if (network === 'hartest' || network === 'development') {
    await _AvatarManager.setGameManager(GM.address);
    _GM = await GM.deployed();
  } else if (network === "hartest") {
    await _AvatarManager.setGameManager(
      "0xc65F8BA708814653EDdCe0e9f75827fe309E29aD"
    );
    _GM = await GM.at("0xc65F8BA708814653EDdCe0e9f75827fe309E29aD");
  } else {
    // harmain
    await _AvatarManager.setGameManager(
      "0x0D112a449D23961d03E906572D8ce861C441D6c3"
    );
    _GM = await GM.at("0x0D112a449D23961d03E906572D8ce861C441D6c3");
  }

  await _GM.setAvatarAddress(AvatarManager.address);

  // TODO move DAO to particular addresses for real networks
  // or not to forget to do it manually
};
