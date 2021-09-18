const MarsColony = artifacts.require('MarsColony');

module.exports = function(deployer) {
  const DAOByNetwork = {
    bsct: '0xd115ab5b013f211FdfEC73674785Ba2239e95a7b', // my test wallet to test
    bsc: '0xda4eF1894fbA63F2F8E8687944A5529A87ccECb2', // gnosis binance 'marscolony-safe'
  };
  const DAO = DAOByNetwork[deployer.network] ?? DAOByNetwork['bsc'];
  deployer.deploy(MarsColony, DAO, 10, [
    '0x35263D5B2e24b8FE955B83C5735843E1aD34dE9d',
    '0x04077e97b8169e8A603eb21a009De45c68F58ccB',
    '0x568945E5F0FA8409beb2F3a53842ECd2798B62c2',
  ]);
};
