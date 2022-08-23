/**
 * needed in case if deployed with wrong proxy admin
 */

const ProxyAdmin = artifacts.require('ProxyAdmin');

module.exports = async (deployer, network, addresses) => {
  if (network === "development") {
    return; // this file for manual migrations; pass in tests
  }

  const oldPA = await ProxyAdmin.at('0x6bb2c8bc214fc4dcc3be529b8fff61127014c28d');

  await oldPA.changeProxyAdmin('0x4B895e733B8F1D50ec7f92BccCF763f85b5f963b', '0xa85Dda80Dd10ecE178e59B964Bc094AdE4fa4f31');

};
