const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const SalesManager = artifacts.require("SalesManager")
const GM = artifacts.require('GameManager');
const MC = artifacts.require('MC'); // land NFT

module.exports = async (deployer, network, [DAO, treasury, liquidity]) => {
  let _MC;

  if (network === 'development') {
    _MC = await MC.deployed();
  } else if (network === 'hartest') {
    _MC = await MC.at('0xc268D8b64ce7DB6Eb8C29562Ae538005Fded299A');
  } else { // harmain
    _MC = await MC.at('0x0bC0cdFDd36fc411C83221A348230Da5D3DfA89e');
  }

  await deployProxy(SalesManager, [
    DAO,
    _MC.address,
  ], { deployer });
  
  await _MC.setSalesManager(SalesManager.address);
  
  let _GM;
  
  if (network === 'development') {
    _GM = await GM.deployed();
  } else if (network === 'hartest') {
    _GM = await GM.at('0xc65F8BA708814653EDdCe0e9f75827fe309E29aD');
  } else { // harmain
    _GM = await GM.at('0x0D112a449D23961d03E906572D8ce861C441D6c3');
  }

  await _GM.setSalesManager(SalesManager.address);
};
