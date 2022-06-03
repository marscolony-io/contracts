const McIno = artifacts.require('McIno');

module.exports = async (deployer, network, addresses) => {
  console.log(addresses[0]);
  if (network !== 'development') {
    return; // this file for test only
  }

  await deployer.deploy(McIno);
};