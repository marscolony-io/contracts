/**
 * Empty migration used to deploy instances to upgrade manually
 * ```
 * truffle deploy --network hartest -f 3 --to 3
 * ```
 */

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const GameManager = artifacts.require('GameManager');
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

  await deployer.deploy(GameManager);
  const PA = await ProxyAdmin.at('0xa85Dda80Dd10ecE178e59B964Bc094AdE4fa4f31');
  await PA.upgrade('0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797', GameManager.address)

  // const sm = await SalesManager.at('0x361812f92f5B072E4972a3fB47b0e515dEbB5610');

  // await sm.setMC('0xb5D95034171733F3D636B49e5f4703d7d906b1a4');

  // const mc = await MC.at('0xb5D95034171733F3D636B49e5f4703d7d906b1a4');

  // await mc.setSalesManager('0x361812f92f5B072E4972a3fB47b0e515dEbB5610');
  
};
