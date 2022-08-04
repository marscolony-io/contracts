const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AvatarManager = artifacts.require("AvatarManager");
const MartianColonists = artifacts.require("MartianColonists");
const GameManagerFixed = artifacts.require("GameManagerFixed");
const GameManagerShares = artifacts.require("GameManagerShares");

module.exports = async (deployer, network) => {
  await deployer.deploy(
    MartianColonists,
    network === "hartest"
      ? "https://meta-avatar-test.marscolony.io/"
      : "https://meta-avatar.marscolony.io/"
  );
  await deployProxy(AvatarManager, [MartianColonists.address], { deployer });
  const mcl = await MartianColonists.deployed();
  await mcl.setAvatarManager(AvatarManager.address);

  const _AvatarManager = await AvatarManager.deployed();
  let gm;
  if (network === 'development') {
    await _AvatarManager.setGameManager(GameManagerFixed.address);
    gm = await GameManagerFixed.deployed();
  } else {
    // harmain
    await _AvatarManager.setGameManager(
      "0x0D112a449D23961d03E906572D8ce861C441D6c3"
    );
    gm = await GameManagerFixed.at("0x0D112a449D23961d03E906572D8ce861C441D6c3");
  }

  await gm.setAvatarAddress(AvatarManager.address);
};
