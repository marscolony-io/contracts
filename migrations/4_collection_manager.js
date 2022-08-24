const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const CollectionManager = artifacts.require("CollectionManager");
const MartianColonists = artifacts.require("MartianColonists");
const GameManagerFixed = artifacts.require("GameManagerFixed");
const GameManagerShares = artifacts.require("GameManagerShares");

module.exports = async (deployer, network) => {
  await deployer.deploy(
    MartianColonists,
    "https://meta-avatar-polygon.marscolony.io/"
  );
  await deployProxy(CollectionManager, [MartianColonists.address], {
    deployer,
  });
  const mcl = await MartianColonists.deployed();
  await mcl.setCollectionManager(CollectionManager.address);

  const _collectionManager = await CollectionManager.deployed();
  let gm;
  if (network === "development") {
    await _collectionManager.setGameManager(GameManagerFixed.address);
    gm = await GameManagerFixed.deployed();
  } else {
    // harmain
    await _collectionManager.setGameManager(
      "0x0D112a449D23961d03E906572D8ce861C441D6c3"
    );
    gm = await GameManagerFixed.at(
      "0x0D112a449D23961d03E906572D8ce861C441D6c3"
    );
  }

  await gm.setCollectionAddress(CollectionManager.address);
};
