const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const AvatarManager = artifacts.require("AvatarManager");
const CryochamberManager = artifacts.require("CryochamberManager");
const ProxyAdmin = artifacts.require("ProxyAdmin");

const MCL = artifacts.require("MartianColonists");
const GM = artifacts.require("GameManagerShares");

module.exports = async (deployer, network, addrs) => {
  const _MCL = await MCL.deployed();

  const _AvatarManager = await AvatarManager.deployed();

  await deployProxy(
    CryochamberManager,
    [MCL.address, AvatarManager.address],
    {
      deployer,
    }
  );

  const _CRYO = await CryochamberManager.deployed();

  let _GM;
  if (network === "development") {
    await _AvatarManager.setCryochamberManager(_CRYO.address);
    _GM = await GM.deployed();
  } else {
    // // harmain
    // await _AvatarManager.setGameManager(
    //   "0x0D112a449D23961d03E906572D8ce861C441D6c3"
    // );
    _GM = await GM.at("0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797");
  }

  await _GM.setCryochamberAddress(_CRYO.address);
  await _CRYO.setGameManager(_GM.address);
};
