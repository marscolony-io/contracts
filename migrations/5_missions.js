const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const MissionManager = artifacts.require("MissionManager");
const CollectionManager = artifacts.require("CollectionManager");
const GameManagerFixed = artifacts.require("GameManagerFixed");
const GameManagerShares = artifacts.require("GameManagerShares");
const MartianColonists = artifacts.require("MartianColonists"); // avatars NFT
const MC = artifacts.require("MC"); // land NFT

module.exports = async (deployer, network, [DAO]) => {
  let _collectionManager;
  let _MCL;
  let _MC;
  if (network === "development") {
    _collectionManager = await CollectionManager.deployed();
    _MCL = await MartianColonists.deployed();
    _MC = await MC.deployed();
  } else if (network === "hartest") {
    _collectionManager = await CollectionManager.at(
      "0xdE165766CC7C48C556c8C20247b322Dd23EB313a"
    );
    _MCL = await MartianColonists.at(
      "0xDEfafb07765D9D0F897260BE1389743A09802F20"
    );
    _MC = await MC.at("0xc268D8b64ce7DB6Eb8C29562Ae538005Fded299A");
  } else {
    // harmain
    _collectionManager = await CollectionManager.at(
      "0xCc55065afd013CF06f989448cf724fEC4fF29626"
    );
    _MCL = await MartianColonists.at(
      "0xFDCC01E0Fe5D3Fb11B922447093EE6862685616c"
    );
    _MC = await MC.at("0x0bC0cdFDd36fc411C83221A348230Da5D3DfA89e");
  }
  await deployProxy(
    MissionManager,
    [_MCL.address, _collectionManager.address, _MC.address],
    { deployer }
  );

  const _MissionManager = await MissionManager.deployed();
  let _GM;
  if (network === "development") {
    await _MissionManager.setGameManager(GameManagerFixed.address);
    _GM = await GameManagerFixed.deployed();
  } else {
    // harmain
    await _MissionManager.setGameManager(
      "0x0D112a449D23961d03E906572D8ce861C441D6c3"
    );
    _GM = await GameManagerFixed.at(
      "0x0D112a449D23961d03E906572D8ce861C441D6c3"
    );
  }

  await _GM.setMissionManager(MissionManager.address);
};
