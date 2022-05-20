const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GM = artifacts.require("GameManager");
const LBX = artifacts.require("Lootboxes");
const AVATARS = artifacts.require("MartianColonists");
const MC = artifacts.require("MC");

contract("Lootboxes", (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let lbx;
  let mc;

  before(async () => {
    gm = await GM.deployed();
    lbx = await LBX.deployed();
    avatars = await AVATARS.deployed();
    mc = await MC.deployed();

    await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
    await gm.claim([1], { value: web3.utils.toWei("0.1"), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
    await time.increase(60 * 60 * 24 * 365);
    await gm.claimEarned([1], { from: user1 });
    await gm.claimEarned([200], { from: user2 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
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

  describe("Finish Mission", function() {
    const signer = {
      privateKey:
        "4028ea385a848c51ff76c0d968305e273d415335ccd06854630a8465b67a9eef",
      address: "0x5a636D26070A8a132E4731743CA12964CBB1950b",
    };

    it("Set message sender to backend sender", async () => {
      await gm.setBackendSigner(signer.address);
    });

    it("Mint avatar owner lootbox", async () => {
      await lbx.setGameManager(gm.address);

      const message =
        "1111111111111111111111111111111100002000022100010000000121111111111111111111111";
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      const ownerOfAvatar3 = await avatars.ownerOf(2);

      await gm.finishMission(message, signature.v, signature.r, signature.s);

      const totalSupply = await lbx.totalSupply();
      expect(Number(totalSupply.toString())).to.be.equal(3);

      const lootBoxOwner = await lbx.ownerOf(3);
      expect(lootBoxOwner).to.be.equal(ownerOfAvatar3);
    });

    it("Increase lootBoxesToMint for land owner lootbox", async () => {
      await lbx.setGameManager(gm.address);

      const lootBoxesToMintBefore = await gm.lootBoxesToMint(1);
      console.log("lootBoxesToMintBefore", lootBoxesToMintBefore.toString());

      const message =
        "1111111111111111111111111111111100002000020000110000000231111111111111111111111";
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      const ownerOfLand = await mc.ownerOf(1);

      console.log({ ownerOfLand: ownerOfLand.toString() });

      await gm.finishMission(message, signature.v, signature.r, signature.s);

      const totalSupply = await lbx.totalSupply();
      expect(Number(totalSupply.toString())).to.be.equal(3);

      const lootBoxesToMintAfter = await gm.lootBoxesToMint(1);
      console.log("lootBoxesToMintAfter", lootBoxesToMintAfter.toString());

      expect(lootBoxesToMintAfter - lootBoxesToMintBefore).to.be.equal(1);
    });

    it("Reverts if land has no lootboxes to mint", async () => {
      const tx = gm.mintLootbox(2);
      await truffleAssert.reverts(tx, "you can not mint lootbox for this land");
    });

    it("Reverts if minted by not the land ovner", async () => {
      const tx = gm.mintLootbox(1, { from: user2 });
      await truffleAssert.reverts(tx, "you are not a land owner");
    });

    it("Mint new lootbox success path", async () => {
      await gm.mintLootbox(1, { from: user1 });

      const lootBoxOwner = await lbx.ownerOf(3);
      expect(lootBoxOwner).to.be.equal(user1);
    });
  });
});
