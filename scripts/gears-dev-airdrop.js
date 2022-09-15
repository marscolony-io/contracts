const GM = artifacts.require("GameManagerFixed");
const CM = artifacts.require("CollectionManager");
const GEARS = artifacts.require("GEARS");

const userAddressToMintGears = "";
const collectionManagerAddress = "";
const ownerAddress = "";

module.exports = async (callback) => {
  try {
    const gm = await GM.at("");
    const cm = await CM.at("");
    const gears = await GEARS.at("");

    // call as owner, set owner a manager
    await gears.setCollectionManager(ownerAddress);

    await gears.mint(userAddressToMintGears, 0, 0, 300);
    await gears.mint(userAddressToMintGears, 0, 3, 300);
    await gears.mint(userAddressToMintGears, 0, 6, 300);
    await gears.mint(userAddressToMintGears, 0, 9, 300);
    await gears.mint(userAddressToMintGears, 1, 1, 300);
    await gears.mint(userAddressToMintGears, 1, 4, 300);
    await gears.mint(userAddressToMintGears, 1, 7, 300);
    await gears.mint(userAddressToMintGears, 1, 10, 300);
    await gears.mint(userAddressToMintGears, 2, 2, 300);
    await gears.mint(userAddressToMintGears, 2, 5, 300);
    await gears.mint(userAddressToMintGears, 2, 8, 300);
    await gears.mint(userAddressToMintGears, 2, 11, 300);
    await gears.mint(userAddressToMintGears, 2, 12, 300);
    await gears.mint(userAddressToMintGears, 2, 13, 300);

    await gears.setCollectionManager(collectionManagerAddress);

    callback();
  } catch (error) {
    console.log(error);
    callback();
  }
};
