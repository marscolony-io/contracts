const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GM = artifacts.require("GameManager");
const LBX = artifacts.require("Lootboxes");

contract("Lootboxes", (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let lbx;

  before(async () => {
    gm = await GM.deployed();
    lbx = await LBX.deployed();
  });

  describe("Mint", function() {
    it("Reverts if mint called not by mission manager", async () => {
      const tx = lbx.mint(user2);
      await truffleAssert.reverts(tx, "only game manager");
    });

    it("Mints if called by mission manager", async () => {
      await lbx.setGameManager(DAO);
      await lbx.mint(user1);
      await lbx.mint(user2);
      const supplyAfterMint = await lbx.totalSupply();
      expect(Number(supplyAfterMint.toString())).to.be.equal(2);
      const ownerOf1 = await lbx.ownerOf(1);
      const ownerOf2 = await lbx.ownerOf(2);
      expect(ownerOf1).to.be.equal(user1);
      expect(ownerOf2).to.be.equal(user2);
    });
  });

  describe("Open", function() {
    it("Reverts if open called not by game manager", async () => {
      await lbx.setGameManager(user1);
      const tx = lbx.open(1);
      await truffleAssert.reverts(tx, "only game manager");
    });

    it("Open lootbox", async () => {
      await lbx.setGameManager(DAO);
      await lbx.open(1);
      const isOpened = await lbx.opened(1);
      expect(isOpened).to.be.equal(true);

      const isNotOpened = await lbx.opened(2);
      expect(isNotOpened).to.be.equal(false);
    });
  });
});
