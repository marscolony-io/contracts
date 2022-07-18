const { time } = require("openzeppelin-test-helpers");
const GM = artifacts.require("GameManager");
const MC = artifacts.require("MC");
const MSN = artifacts.require("MissionManager");
const MCL = artifacts.require("MartianColonists");

module.exports = async (callback) => {
  try {
    const mcl = await MCL.at('0xFDCC01E0Fe5D3Fb11B922447093EE6862685616c');;


    console.log(await mcl.ownerOf(9188));

    callback();
  } catch (error) {
    console.log(error);
  }
};
