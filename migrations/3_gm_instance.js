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
const Lootboxes = artifacts.require("Lootboxes");

module.exports = async (deployer, network, addresses) => {
  if (network === "development") {
    return; // this file for manual migrations; pass in tests
  }
  const inst = await deployer.deploy(GM);
  // const lb = await deployer.deploy(Lootboxes, 'https://lootboxes-harmony.marscolony.io/');
  const PA = await ProxyAdmin.at('0xa85Dda80Dd10ecE178e59B964Bc094AdE4fa4f31');
  await PA.upgrade('0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797', GM.address);
  // const gm = await GM.at('0xc65F8BA708814653EDdCe0e9f75827fe309E29aD');
  // await gm.setLootboxesAddress(Lootboxes.address);


  // await lb.setGameManager('0xc65F8BA708814653EDdCe0e9f75827fe309E29aD');

};
