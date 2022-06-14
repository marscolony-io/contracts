/**
 * Empty migration used to deploy instances to upgrade manually
 * ```
 * truffle deploy --network hartest -f 3 --to 3
 * ```
 */

const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const { ether, BN } = require('openzeppelin-test-helpers');

const GameManager = artifacts.require('GameManager');
const AM = artifacts.require('AvatarManager');
const MM = artifacts.require('MissionManager');
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

  // await deployer.deploy(MC, 'https://meta-polygon.marscolony.io/');

  const mc_old = await MC.at('0xb5D95034171733F3D636B49e5f4703d7d906b1a4');
  const mc_new = await MC.at('0x3B45B2AEc65A4492B7bd3aAd7d9Fa8f82B79D4d0');

  const allTokens = [];

  let result;
  let i = 3018;
  while (!result || result.length !== 0) {
    result = await mc_old.allTokensPaginate(0 + i, 24 + i);
    i += 25;
    const bunch = [[], []];
    for (const item of result) {
      const owner = await mc_old.ownerOf(item);
      console.log(owner, +item, i);
      bunch[0].push(owner);
      bunch[1].push(item);
    }
    await mc_new.migrationMint(bunch[0], bunch[1], false);
    console.log('JHFGJKHJ')
    // result.forEach(element => allTokens.push(+element));
  }

  console.log(allTokens, allTokens.length)

  // const PA = await ProxyAdmin.at('0xa85Dda80Dd10ecE178e59B964Bc094AdE4fa4f31');
  // console.log(await PA.getProxyImplementation('0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797'));
  // await PA.upgrade('0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797', GameManager.address)


  
};
