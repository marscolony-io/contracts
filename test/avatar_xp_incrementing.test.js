const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GM = artifacts.require("GameManager");
const CLNY = artifacts.require("CLNY");
const AvatarManager = artifacts.require("AvatarManager");
const NFT = artifacts.require("MartianColonists");
const MSN = artifacts.require("MissionManager");
const MC = artifacts.require("MC");

contract("AvatarManager", (accounts) => {
  const [user0, user1, user2] = accounts;

  let gm;
  let avatarManager;

  before(async () => {
    gm = await GM.deployed();
    avatarManager = await AvatarManager.deployed();
  });

  describe("AvatarManager xp increase", function() {
    it("Set gm to user0; check addXP permissions", async () => {
      await expectRevert(avatarManager.addXP(1, 100), 'Only GameManager');
      await avatarManager.setGameManager(user0);
      const initialXP = await avatarManager.getXP([1, 2, 3]);
      expect(+initialXP[0]).to.be.equal(100);
      expect(+initialXP[1]).to.be.equal(100);
      expect(+initialXP[2]).to.be.equal(100);
      await avatarManager.addXP(1, 100);
      const xpAfterAdding = await avatarManager.getXP([1]);
      expect(+xpAfterAdding[0]).to.be.equal(200);
      await avatarManager.setGameManager(gm.address);
    });
  });
});
