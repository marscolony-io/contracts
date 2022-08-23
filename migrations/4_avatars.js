const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AvatarManager = artifacts.require("AvatarManager");
const MartianColonists = artifacts.require("MartianColonists");
const GameManagerFixed = artifacts.require("GameManagerFixed");
const GameManagerShares = artifacts.require("GameManagerShares");

module.exports = async (deployer, network) => {
  await deployer.deploy(
    MartianColonists,
    "https://meta-avatar-polygon.marscolony.io/"
  );
  await deployProxy(AvatarManager, [], { deployer });
  const mcl = await MartianColonists.deployed();
  await mcl.setAvatarManager(AvatarManager.address);

  const _AvatarManager = await AvatarManager.deployed();
  let gm;
  if (network === 'development') {
    await _AvatarManager.setGameManager(GameManagerFixed.address);
    gm = await GameManagerFixed.deployed();
  }
  
  await gm.setAvatarAddress(AvatarManager.address);

  
};
