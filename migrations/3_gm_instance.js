/**
 * Empty migration used to deploy instances to upgrade manually
 * ```
 * truffle deploy --network hartest -f 3 --to 3
 * ```
 */

const GM = artifacts.require("GameManager");
const AM = artifacts.require("AvatarManager");
const MM = artifacts.require("MissionManager");
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
    // const am = await deployer.deploy(AM);
    const gm = await deployer.deploy(GM);
    const mm = await deployer.deploy(MM);
    const PA = await ProxyAdmin.at('0xBb459C6066331fd3e92A54828DAA696e0661c902');
    await PA.upgrade('0xf3f2f703b7BaAfD09f7a1C41b06e2D04B0Fad09C', MM.address)
    await PA.upgrade('0x0Dd5dDaC089613F736e89F81E16361b09c7d53C6', GM.address)
    // await PA.upgrade('0x0D625029E21540aBdfAFa3BFC6FD44fB4e0A66d0', AM.address)
  }

  // if (network === "harmony") {
  //   const am = await deployer.deploy(AM);
  //   const gm = await deployer.deploy(GM);
  //   const PA = await ProxyAdmin.at('0xBb459C6066331fd3e92A54828DAA696e0661c902');
  //   await PA.upgrade('0x0D112a449D23961d03E906572D8ce861C441D6c3', GM.address)
  //   await PA.upgrade('0xCc55065afd013CF06f989448cf724fEC4fF29626', AM.address)
  // }
};
