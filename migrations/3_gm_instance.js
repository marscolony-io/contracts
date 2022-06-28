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

module.exports = async (deployer, network, addresses) => {
  if (network === "development") {
    return; // this file for manual migrations; pass in tests
  }
  if (network === "fuji") {
    const am = await deployer.deploy(AM);
    const gm = await deployer.deploy(GM);
    const PA = await ProxyAdmin.at('0xBb459C6066331fd3e92A54828DAA696e0661c902');
    await PA.upgrade('0x0D112a449D23961d03E906572D8ce861C441D6c3', GM.address)
    await PA.upgrade('0xCc55065afd013CF06f989448cf724fEC4fF29626', AM.address)
  }
};
