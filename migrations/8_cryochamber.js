const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const CollectionManager = artifacts.require("CollectionManager");
const CryochamberManager = artifacts.require("CryochamberManager");
const ProxyAdmin = artifacts.require("ProxyAdmin");

const MCL = artifacts.require("MartianColonists");
const GM = artifacts.require("GameManagerShares");

module.exports = async (deployer, network, addrs) => {
  const _MCL = await MCL.deployed();
  const _collectionManager = await CollectionManager.deployed();

  await deployProxy(
    CryochamberManager,
    [_MCL.address, _collectionManager.address],
    {
      deployer,
    }
  );

  const _CRYO = await CryochamberManager.deployed();

  let _GM;
  if (network === "development") {
    await _collectionManager.setCryochamberManager(_CRYO.address);
    _GM = await GM.deployed();
  } else if (network === "hartest") {
    // await _collectionManager.setGameManager(
    //   "0xc65F8BA708814653EDdCe0e9f75827fe309E29aD"
    // );
    // _GM = await GM.at("0xc65F8BA708814653EDdCe0e9f75827fe309E29aD");
  } else {
    // // harmain
    // await _collectionManager.setGameManager(
    //   "0x0D112a449D23961d03E906572D8ce861C441D6c3"
    // );
    _GM = await GM.at("0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797");
  }

  await _GM.setCryochamberAddress(_CRYO.address);
  await _CRYO.setGameManager(_GM.address);
};
