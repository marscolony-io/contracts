const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GM = artifacts.require("GameManager");
const CLNY = artifacts.require("CLNY");
const AvatarManager = artifacts.require("AvatarManager");
const NFT = artifacts.require("MartianColonists");
const MSN = artifacts.require("MissionManager");
const MC = artifacts.require("MC");
const LS = artifacts.require("LandStats");

contract("LandStats", (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let clny;
  let avatars;
  let nft;
  let msn;
  let ls;

  before(async () => {
    gm = await GM.deployed();
    clny = await CLNY.deployed();
    avatars = await AvatarManager.deployed();
    nft = await NFT.deployed();
    msn = await MSN.deployed();
    mc = await MC.deployed();
    ls = await LS.deployed();
    clny = await CLNY.deployed();

    await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
    await gm.claim([100], { value: web3.utils.toWei("0.1"), from: user1 });
    await time.increase(60 * 60 * 24 * 365.25 * 1000); // wait 10 years
    await gm.claimEarned([100], { from: user1 }); // claim 3652.5 clny
  });

  describe("getLandData()", function() {
    it("Returns land data for empty land", async () => {
      const landData = await ls.getLandData([100]);

      console.log({ landData });
      // assert.isTrue(Array.isArray(missions));
      // assert.equal(missions.length, 0);
    });
  });

  describe("gelClnyStat()", function() {
    it("Returns clny stat", async () => {
      const stat = await ls.gelClnyStat();
      console.log({ stat });

      const userBalance = await clny.balanceOf(user1);
      console.log({ userBalance: userBalance.toString() });

      const minted = await clny.burnedStats(7);
      console.log(minted.toString());
      // assert.isTrue(Array.isArray(missions));
      // assert.equal(missions.length, 0);
    });
  });
});
