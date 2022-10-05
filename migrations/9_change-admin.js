/**
 * needed in case if deployed with wrong proxy admin
 */

const ProxyAdmin = artifacts.require('ProxyAdmin');

module.exports = async (deployer, network, addresses) => {
  if (network === "development") {
    return; // this file for manual migrations; pass in tests
  }

  const oldPA = await ProxyAdmin.at('0x07a83B70C5109757bac760a28477Cba2E2536B26');
  console.log(await oldPA.getProxyImplementation('0x862A44AC752b5D0F6727aaE2A334D302F8324560'));

  await oldPA.changeProxyAdmin('0x862A44AC752b5D0F6727aaE2A334D302F8324560', '0xBb459C6066331fd3e92A54828DAA696e0661c902');

};
