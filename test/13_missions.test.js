const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GM = artifacts.require("GameManager");
const CLNY = artifacts.require("CLNY");
const AvatarManager = artifacts.require("AvatarManager");
const NFT = artifacts.require("MartianColonists");
const MSN = artifacts.require("MissionManager");
const MC = artifacts.require("MC");

contract("MissionsManager", (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let clny;
  let avatars;
  let nft;
  let msn;

  before(async () => {
    gm = await GM.deployed();
    clny = await CLNY.deployed();
    avatars = await AvatarManager.deployed();
    nft = await NFT.deployed();
    msn = await MSN.deployed();
    mc = await MC.deployed();
    await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
    await gm.claim([100], { value: web3.utils.toWei("0.1"), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
    await time.increase(60 * 60 * 24 * 365.25 * 1000); // wait 10 years
    await gm.claimEarned([100], { from: user1 }); // claim 3652.5 clny
  });

  describe("getAvailableMissions()", function() {
    it("Returns empty array if no lands have been sent in function params", async () => {
      const missions = await msn.getAvailableMissions([]);
      assert.isTrue(Array.isArray(missions));
      assert.equal(missions.length, 0);
    });

    it("Returns lands by lands ids", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands).to.have.lengthOf(2);
      // expect(availableLands[0].availableMissionCount === "1");
      // expect(availableLands[1].availableMissionCount === "1");
    });

    it("Returns lands with correct private flags", async () => {
      await msn.setAccountPrivacy(true, { from: user1 });
      const lands = await mc.allTokensPaginate(0, 1);
      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands[0].isPrivate).to.be.true;
      expect(availableLands[1].isPrivate).to.be.false;
    });

    it("Returns land with limit 0", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("0");
    });

    it("Returns land with limit 1 for base station", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      await gm.buildBaseStation(100, { from: user1 });
      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("1");
    });

    it("Returns land with limit 2 for Power Plant 1 level", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      await gm.buildPowerProduction(100, 1, { from: user1 });

      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("2");
    });

    it("Returns land with limit 3 for Power Plant 2 level", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      await gm.buildPowerProduction(100, 2, { from: user1 });

      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("3");
    });

    it("Returns land with limit 4 for Power Plant 2 level", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      await gm.buildPowerProduction(100, 3, { from: user1 });

      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("4");
    });
  });
});
