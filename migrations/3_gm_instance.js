/**
 * Empty migration used to deploy instances to upgrade manually
 * ```
 * truffle deploy --network hartest -f 3 --to 3
 * ```
 */

const GM = artifacts.require("GameManagerFixed");
const CM = artifacts.require("CollectionManager");
const MM = artifacts.require("MissionManager");
const MC = artifacts.require("MC");
const Lootboxes = artifacts.require("Lootboxes");
const ProxyAdmin = artifacts.require("ProxyAdmin");
const CryochamberManager = artifacts.require("CryochamberManager");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

module.exports = async (deployer, network, addresses) => {
  if (network === "development") {
    return; // this file for manual migrations; pass in tests
  }
  const lb = await Lootboxes.at('0x09689031eB0dcaFFf602C05055f00E09FeE7c6E6');
  console.log(await lb.gameManager);
};
