/**
 * Empty migration used to deploy instances to upgrade manually
 * ```
 * truffle deploy --network hartest -f 3 --to 3
 * ```
 */

const { deployProxy } = require("@openzeppelin/truffle-upgrades");
// const { ether, BN } = require('openzeppelin-test-helpers');

const GameManager = artifacts.require("GameManager");
const AM = artifacts.require("AvatarManager");
const MM = artifacts.require("MissionManager");
const MC = artifacts.require("MC");
const CLNY = artifacts.require("CLNY");
const MartianColonists = artifacts.require("MartianColonists");
const SalesManager = artifacts.require("SalesManager");
const ProxyAdmin = artifacts.require("ProxyAdmin");

module.exports = async (deployer, network, addresses) => {
  if (network === "development") {
    return; // this file for manual migrations; pass in tests
  }
  console.log(addresses);
};
