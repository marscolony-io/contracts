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
  // const inst = await deployer.deploy(CryochamberManager);

  // console.log('111');
  // const PA = await ProxyAdmin.at('0xBb459C6066331fd3e92A54828DAA696e0661c902');
  // console.log('111');
  // await PA.upgrade('0x2D2f5349896BF4012EA27Db345fbF8a71775d16f', CryochamberManager.address);
  // console.log('223');

  const cm = await CryochamberManager.at('0x2D2f5349896BF4012EA27Db345fbF8a71775d16f');
  await cm.setEnergyPrice(web3.utils.toWei('10'));

  console.log(+await cm.energyPrice());

  // const am = await AM.at('0xCc55065afd013CF06f989448cf724fEC4fF29626');
  // console.log('212');
  // await am.setCryochamberManager('0x2D2f5349896BF4012EA27Db345fbF8a71775d16f');
  // console.log('222');

  // const PA2 = await ProxyAdmin.at('0x07a83B70C5109757bac760a28477Cba2E2536B26');
  // await PA2.changeProxyAdmin('0x2D2f5349896BF4012EA27Db345fbF8a71775d16f', '0xBb459C6066331fd3e92A54828DAA696e0661c902');
};
