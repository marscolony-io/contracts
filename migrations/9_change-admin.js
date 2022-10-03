/**
 * needed in case if deployed with wrong proxy admin
 */

const ProxyAdmin = artifacts.require('ProxyAdmin');

module.exports = async (deployer, network, addresses) => {
  if (network === "development") {
    return; // this file for manual migrations; pass in tests
  }

  const oldPA = await ProxyAdmin.at('0xBb459C6066331fd3e92A54828DAA696e0661c902');
  console.log(await oldPA.getProxyImplementation('0x4E57E44c73Ff97563338ECa2585339b91BBfd1f3'));

  // await oldPA.changeProxyAdmin('0x4E57E44c73Ff97563338ECa2585339b91BBfd1f3', '0xBb459C6066331fd3e92A54828DAA696e0661c902');

};
