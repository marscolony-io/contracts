const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const GM = artifacts.require("GameManager");
const MC = artifacts.require("MC"); // land NFT
const CLNY = artifacts.require("CLNY");
const LandStats = artifacts.require("LandStats");

module.exports = async (deployer, network, [DAO, treasury, liquidity]) => {
  let _MC;
  let _CLNY;
  let _GM;

  if (network === "development") {
    _MC = await MC.deployed();
    _GM = await GM.deployed();
    _CLNY = await CLNY.deployed();
  } else if (network === "mumbai") {
    _MC = await MC.at("0xBF5C3027992690d752be3e764a4B61Fc6910A5c0");
    _GM = await GM.at("0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797");
    _CLNY = await CLNY.at("0x73E6432Ec675536BBC6825E16F1D427be44B9639");
  } else if (network === "polygon") {
    _MC = await MC.at("0x3B45B2AEc65A4492B7bd3aAd7d9Fa8f82B79D4d0");
    _GM = await GM.at("0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797");
    _CLNY = await CLNY.at("0xCEBaF32BBF205aDB2BcC5d2a5A5DAd91b83Ba424");
  }

  await deployer.deploy(LandStats, _GM.address, _MC.address, _CLNY.address);
  const ls = await LandStats.deployed();
  console.log("ls address", ls.address);
};
