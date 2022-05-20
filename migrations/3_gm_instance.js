/**
 * Empty migration used to deploy instances to upgrade manually
 * ```
 * truffle deploy --network hartest -f 3 --to 3
 * ```
 */

const GM = artifacts.require("GameManager");
const AM = artifacts.require("AvatarManager");
const MC = artifacts.require("MC");
const CLNY = artifacts.require("CLNY");
const MartianColonists = artifacts.require("MartianColonists");
const Poll = artifacts.require("Poll");

module.exports = async (deployer, network, addresses) => {
  if (network === "development") {
    return; // this file for manual migrations; pass in tests
  }
  // const inst = await deployer.deploy(AM);
};
