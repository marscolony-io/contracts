const { time } = require("openzeppelin-test-helpers");
const GM = artifacts.require("GameManager");
const MC = artifacts.require("MC");
const MSN = artifacts.require("MissionManager");

module.exports = async (callback) => {
  try {
    const mc = await MC.deployed();
    const msn = await MSN.deployed();
    const gm = await GM.deployed();

    console.log("msn", msn.address);
    console.log("gm", gm.address);

    const totalLands = await mc.totalSupply();
    console.log({ totalLands });

    // await time.increase(60 * 60 * 24 * 10);

    const { earned: earned2 } = (await gm.getAttributesMany([1]))[0];
    console.log({ earned2 });

    callback();
  } catch (error) {
    console.log(error);
  }
};
