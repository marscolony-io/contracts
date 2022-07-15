const { time } = require("openzeppelin-test-helpers");
const GM = artifacts.require("GameManager");
const MC = artifacts.require("MC");
const MSN = artifacts.require("MissionManager");
const CLNY = artifacts.require("CLNY");
const COLONISTS = artifacts.require("MartianColonists");
const AvatarManager = artifacts.require("AvatarManager");
const LandStats = artifacts.require("LandStats");
// const CryochamberManager = artifacts.require("CryochamberManager");

module.exports = async (callback) => {
  try {
    const accounts = await web3.eth.getAccounts();
    const mc = await MC.deployed();
    const msn = await MSN.deployed();
    const gm = await GM.deployed();
    const clny = await CLNY.deployed();
    const nft = await COLONISTS.deployed();
    // const cryo = await CryochamberManager.deployed();
    let avatars = await AvatarManager.deployed();
    let ls = await LandStats.deployed();

    console.log(`
MISSION_MANAGER=${msn.address}
GAME_MANAGER=${gm.address}
AVATAR_MANAGER=${avatars.address}
MC=${mc.address}
MCLN=${nft.address}
CLNY=${clny.address}
LANDSTATS=${ls.address}
`);

    callback();
  } catch (error) {
    console.log(error);
  }
};
