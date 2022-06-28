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
const ProxyAdmin = artifacts.require("ProxyAdmin");
const CryochamberManager = artifacts.require("CryochamberManager");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

module.exports = async (deployer, network, addresses) => {
  if (network === "development") {
    return; // this file for manual migrations; pass in tests
  }
  if (network === "fuji") {
    const am = await deployer.deploy(AM);
    const gm = await deployer.deploy(GM);
    const PA = await ProxyAdmin.at('0xBb459C6066331fd3e92A54828DAA696e0661c902');
    await PA.upgrade('0x0Dd5dDaC089613F736e89F81E16361b09c7d53C6', GM.address)
    await PA.upgrade('0x0D625029E21540aBdfAFa3BFC6FD44fB4e0A66d0', AM.address)
  }
};
