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
    _GM = await GM.deployed();
  } else if (network === "mumbai") {
    _GM = await GM.at("0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797");
  } else if (network === "polygon") {
    _GM = await GM.at("0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797");
  }

  await deployer.deploy(LandStats, _GM.address);
  const ls = await LandStats.deployed();
  console.log("ls address", ls.address);
};
