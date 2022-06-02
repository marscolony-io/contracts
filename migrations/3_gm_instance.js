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
// const ProxyAdmin = artifacts.require('ProxyAdmin');

module.exports = async (deployer, network, addresses) => {
  if (network === 'development') {
    return; // this file for manual migrations; pass in tests
  }
  console.log(addresses);

  // await deployer.deploy(CLNY, addresses[0]);
  const clny = await CLNY.at('0xCEBaF32BBF205aDB2BcC5d2a5A5DAd91b83Ba424');
  await deployer.deploy(GameManager);

  // const PA = await ProxyAdmin.at('0xa85Dda80Dd10ecE178e59B964Bc094AdE4fa4f31');
  // await PA.upgrade('0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797', '0xD9879F45De0D6F7c89d6592b821062d048B126d9')

  const gameManager = await GameManager.at('0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797');
  await gameManager.setCLNYAddress(CLNY.address);
  // const PA = await ProxyAdmin.at('0xa85Dda80Dd10ecE178e59B964Bc094AdE4fa4f31');
  // await PA.upgrade('0x361812f92f5B072E4972a3fB47b0e515dEbB5610', '0xA1125c46aef793aA1Bfe9e04036Dc65E158C2A0c')

  // const sm = await SalesManager.at('0x361812f92f5B072E4972a3fB47b0e515dEbB5610');

  // await sm.setMC('0xb5D95034171733F3D636B49e5f4703d7d906b1a4');

  // const mc = await MC.at('0xb5D95034171733F3D636B49e5f4703d7d906b1a4');

  // await mc.setSalesManager('0x361812f92f5B072E4972a3fB47b0e515dEbB5610');
  
};
