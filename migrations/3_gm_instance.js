/**
 * Empty migration used to deploy instances to upgrade manually
 * ```
 * truffle deploy --network hartest -f 3 --to 3
 * ```
 */

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const GameManager = artifacts.require('GameManager');
const AM = artifacts.require('AvatarManager');
const MM = artifacts.require('MissionManager');
const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');
const MartianColonists = artifacts.require('MartianColonists');
const SalesManager = artifacts.require('SalesManager');
const ProxyAdmin = artifacts.require('ProxyAdmin');

module.exports = async (deployer, network, addresses) => {
  if (network === 'development') {
    return; // this file for manual migrations; pass in tests
  }
  console.log(addresses);

  const mcl = await MartianColonists.at('0x76F8089064f58586471f38824da290913E6a5454');
  const gm = await GameManager.at('0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797');
  const mm = await MM.at('0xf91719366dec915741E57b246f97048D4b5D338e');


  // MM
  // await deployProxy(MM, [
  //   addresses[0],
  //   mcl.address,
  //   '0x85f8e0aBdb0f45D8488ca608Ac6327Edd3705de2',
  //   '0xBF5C3027992690d752be3e764a4B61Fc6910A5c0'
  // ], { deployer });
  // await gm.setMissionManager('0xf91719366dec915741E57b246f97048D4b5D338e');
  await mm.setGameManager('0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797');

  // END MM

  // AM
  // await deployProxy(AM, [addresses[0], mcl.address], { deployer });

  // await mcl.setAvatarManager(AM.address);
  // await gm.setAvatarAddress(AM.address);

  // END AM

  // await deployer.deploy(GameManager);
  // const PA = await ProxyAdmin.at('0xa85Dda80Dd10ecE178e59B964Bc094AdE4fa4f31');
  // await PA.upgrade('0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797', GameManager.address)

  // const sm = await SalesManager.at('0x361812f92f5B072E4972a3fB47b0e515dEbB5610');

  // await sm.setMC('0xb5D95034171733F3D636B49e5f4703d7d906b1a4');

  // const mc = await MC.at('0xb5D95034171733F3D636B49e5f4703d7d906b1a4');

  // await mc.setSalesManager('0x361812f92f5B072E4972a3fB47b0e515dEbB5610');
  
};
