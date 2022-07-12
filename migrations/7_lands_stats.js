const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const GM = artifacts.require("GameManager");
const MC = artifacts.require("MC"); // avatars NFT
const CLNY = artifacts.require("CLNY");
const LS = artifacts.require("LandStats");

module.exports = async (deployer, network, [DAO, treasury, liquidity]) => {
  let _GM;
  let _MC;
  let _CLNY;
  if (network === "development") {
    _GM = await GM.deployed();
    _MC = await MC.deployed();
    _CLNY = await CLNY.deployed();
  } else if (network === "hartest") {
    // _MC = await MC.at("0xc268D8b64ce7DB6Eb8C29562Ae538005Fded299A");
  } else {
    // harmain
    // _MCL = await MCL.at("0xFDCC01E0Fe5D3Fb11B922447093EE6862685616c");
  }

  await deployer.deploy(LS, _GM.address, _MC.address, _CLNY.address);
};
