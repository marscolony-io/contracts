const MarsColony = artifacts.require('MarsColony');

module.exports = function(deployer) {
  const DAOByNetwork = {
    bsct: '0xd115ab5b013f211FdfEC73674785Ba2239e95a7b', // my test wallet to test
    bsc: '0xda4eF1894fbA63F2F8E8687944A5529A87ccECb2', // gnosis binance 'marscolony-safe'
  };
  const DAO = DAOByNetwork[deployer.network] ?? DAOByNetwork['bsc'];
  deployer.deploy(MarsColony, DAO);
};
