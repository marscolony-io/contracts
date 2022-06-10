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
  const inst = await deployer.deploy(GM);
  const cm = await deployProxy(
    CryochamberManager, [
      addresses[0], '0xDEfafb07765D9D0F897260BE1389743A09802F20', '0xdE165766CC7C48C556c8C20247b322Dd23EB313a'
    ],
    { deployer }
  );
  console.log('111');
  const PA = await ProxyAdmin.at('0xc470b22A8D173a0DA50191A4A0E5e2b42f6B6009');
  console.log('111');
  await PA.upgrade('0xc65F8BA708814653EDdCe0e9f75827fe309E29aD', GM.address);
  console.log('111');
  const gm = await GM.at('0xc65F8BA708814653EDdCe0e9f75827fe309E29aD');
  console.log('111');
  await gm.setCryochamberAddress(CryochamberManager.address);
  console.log('111');


  await cm.setGameManager('0xc65F8BA708814653EDdCe0e9f75827fe309E29aD');

};
