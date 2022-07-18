const ProxyAdmin = artifacts.require('ProxyAdmin');

module.exports = async (callback) => {
  const pa = await ProxyAdmin.at('0x58145e7725657142C5d749daebEd81A6A28c8e9d')
  // await pa.upgrade('0x6074E5EA15b1A24E3bC840E161a50B1aCA818450', '0x4dA953110286f96AC9FC993A69c029B130B6A620')
  const impl = await pa.getProxyImplementation('0xCaBB5B91E07273516d05b749d4558af82469c3fc')
  console.log({impl});
await 
  callback()
}