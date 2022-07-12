const { expect } = require("chai");
const { time, ether, BN } = require("openzeppelin-test-helpers");

const LandStats = artifacts.require("LandStats");
const CLNY = artifacts.require("CLNY");
const GM = artifacts.require("GameManager");
const MC = artifacts.require("MC");

contract("LandStats", (accounts) => {
  const [owner, user1] = accounts;

  let clny;
  let gm;
  let ls;
  let mc;

  before(async () => {
    clny = await CLNY.deployed();
    gm = await GM.deployed();
    ls = await LandStats.deployed();
    mc = await MC.deployed();

    await gm.setPrice(web3.utils.toWei("0.1"), { from: owner });
    await gm.setClnyPerSecond(
      ether("6000").div(new web3.utils.BN(60 * 60 * 24))
    );
    await gm.claim([100], { value: await gm.getFee(1), from: user1 });

    await time.increase(time.duration.weeks(4));
    await gm.claimEarned([100], { from: user1 });
    console.log(
      "user balance after claimEarned",
      (await clny.balanceOf(user1)) * 1e-18
    );
  });

  describe("getLandData()", function() {
    it("Returns land data for empty land", async () => {
      const landData = await ls.getLandData([100]);
      // console.log({ landData });
      // assert.isTrue(Array.isArray(missions));
      // assert.equal(missions.length, 0);
    });
  });

  describe("gelClnyStat before building", function() {
    it("should return minted colony after 4 weeks", async function() {
      const stat = await ls.gelClnyStat();
      // console.log(stat);
      expect(parseInt(stat.burned)).to.be.equal(0);
      expect(parseInt(stat.minted)).to.be.greaterThan(0);
    });

    it("should set maxLandShare", async function() {
      const maxLandSharesBefore = await gm.maxLandShares();
      // console.log("maxLandSharesBefore", maxLandSharesBefore.toString());

      await gm.buildBaseStation(100, { from: user1 });

      const maxLandSharesAfter = await gm.maxLandShares();
      // console.log("maxLandSharesAfter", maxLandSharesAfter.toString());

      expect(parseInt(maxLandSharesAfter)).to.be.greaterThan(
        parseInt(maxLandSharesBefore)
      );
    });

    it("should return burned colony after building base station", async function() {
      const stat = await ls.gelClnyStat();
      console.log(stat);
      expect(parseInt(stat.burned)).to.be.greaterThan(0);
    });

    it("should return correct land stat for one land", async function() {
      const totalLands = await mc.totalSupply();
      console.log("total lands", totalLands.toString());

      const colonyPerSecond = await gm.clnyPerSecond();
      console.log("colony per second", colonyPerSecond.toString());

      const totalShare = await gm.totalShare();
      console.log("totalShare", totalShare.toString());
      const stat = await ls.gelClnyStat();
      console.log(stat);

      expect(stat.burned).to.be.equal("30000000000000000000");
      expect(stat.avg).to.be.equal("5999999999999999961600");
      expect(stat.avg).to.be.equal(stat.max);
    });

    it("should return correct land stat for two lands", async function() {
      await gm.claim([200], { value: await gm.getFee(1), from: user1 });
      await gm.buildBaseStation(200, { from: user1 });
      await gm.buildTransport(200, 1, { from: user1 });

      const totalLands = await mc.totalSupply();
      console.log("total lands", totalLands.toString());

      const colonyPerSecond = await gm.clnyPerSecond();
      console.log("colony per second", colonyPerSecond.toString());

      const totalShare = await gm.totalShare();
      console.log("totalShare", totalShare.toString());
      const stat = await ls.gelClnyStat();
      console.log(stat);

      expect(stat.burned).to.be.equal("120000000000000000000");
      expect(stat.avg).to.be.equal("2999999999999999980800");
      expect(stat.max).to.be.equal("3599999999999999976960");
    });
  });
});
