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
  const [DAO, user1, user2, user3] = accounts;

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
  });

  describe("Referral program", function() {
    it("Gets default fee with no referrer", async () => {
      const landPrice = await gm.methods["getFee(uint256)"](1, { from: user1 });
      expect(landPrice).to.bignumber.be.equal(web3.utils.toWei("0.1"));
    });

    it("Gets default fee with self referrer ", async () => {
      const landPrice = await gm.methods["getFee(uint256,address)"](1, user1, {
        from: user1,
      });
      expect(landPrice).to.bignumber.be.equal(web3.utils.toWei("0.1"));
    });

    it("Gets fee with 10% discount for referrer that doesn't exist", async () => {
      const landPrice = await gm.methods["getFee(uint256,address)"](
        1,
        "0xe5965345FABb8446f80fd32bC04a276b23224eAC"
      );

      expect(landPrice).to.bignumber.be.equal(web3.utils.toWei("0.09"));
    });

    it("Claims land without referrer", async () => {
      let daoBalanceBefore = web3.utils.toBN(
        await web3.eth.getBalance("0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4")
      );

      const landPrice = await gm.methods["getFee(uint256)"](1, {
        from: user1,
      });

      await gm.claim([100], {
        value: landPrice,
        from: user2,
      });

      let daoBalanceAfter = web3.utils.toBN(
        await web3.eth.getBalance("0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4")
      );

      expect(daoBalanceAfter.sub(daoBalanceBefore)).to.bignumber.be.equal(
        landPrice
      );
    });

    it("Claims land with self referrer", async () => {
      let daoBalanceBefore = web3.utils.toBN(
        await web3.eth.getBalance("0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4")
      );

      const landPrice = await gm.methods["getFee(uint256,address)"](1, user2, {
        from: user2,
      });

      await gm.methods["claim(uint256[],address)"]([106], user2, {
        value: landPrice,
        from: user2,
      });

      let daoBalanceAfter = web3.utils.toBN(
        await web3.eth.getBalance("0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4")
      );

      expect(daoBalanceAfter.sub(daoBalanceBefore)).to.bignumber.be.equal(
        landPrice
      );

      const referrer = await gm.referrers(user2);
      expect(referrer).to.be.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });

    it("Claims land with zero referrer", async () => {
      let daoBalanceBefore = web3.utils.toBN(
        await web3.eth.getBalance("0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4")
      );

      const landPrice = await gm.methods["getFee(uint256)"](1, {
        from: user1,
      });

      await gm.methods["claim(uint256[],address)"](
        [101],
        "0x0000000000000000000000000000000000000000",
        {
          value: landPrice,
          from: user1,
        }
      );

      let daoBalanceAfter = web3.utils.toBN(
        await web3.eth.getBalance("0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4")
      );

      expect(daoBalanceAfter.sub(daoBalanceBefore)).to.bignumber.be.equal(
        landPrice
      );
    });

    it("Claims land with non-zero referrer", async () => {
      let daoBalanceBefore = web3.utils.toBN(
        await web3.eth.getBalance("0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4")
      );
      let referrerBalanceBefore = web3.utils.toBN(
        await web3.eth.getBalance(user2)
      );

      const landPriceRef = await gm.methods["getFee(uint256,address)"](
        1,
        user2,
        { from: user1 }
      );

      await gm.methods["claim(uint256[],address)"]([102], user2, {
        value: landPriceRef,
        from: user1,
      });

      let daoBalanceAfter = web3.utils.toBN(
        await web3.eth.getBalance("0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4")
      );
      let referrerBalanceAfter = web3.utils.toBN(
        await web3.eth.getBalance(user2)
      );

      const referrerShare = landPriceRef.mul(new BN("20")).div(new BN("100"));

      const daoShare = landPriceRef.sub(referrerShare);

      expect(daoBalanceAfter.sub(daoBalanceBefore)).to.bignumber.be.equal(
        daoShare
      );

      expect(
        referrerBalanceAfter.sub(referrerBalanceBefore)
      ).to.bignumber.be.equal(referrerShare);

      const referrerStored = await gm.referrers(user1);
      expect(referrerStored).to.be.equal(user2);
    });

    it("Claims new land with referrer stored", async () => {
      let daoBalanceBefore = web3.utils.toBN(
        await web3.eth.getBalance("0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4")
      );
      let referrerBalanceBefore = web3.utils.toBN(
        await web3.eth.getBalance(user2)
      );

      const landPrice = await gm.methods["getFee(uint256)"](1, {
        from: user1,
      });

      await gm.claim([103], {
        value: landPrice,
        from: user1,
      });

      let daoBalanceAfter = web3.utils.toBN(
        await web3.eth.getBalance("0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4")
      );
      let referrerBalanceAfter = web3.utils.toBN(
        await web3.eth.getBalance(user2)
      );

      const referrerShare = landPrice.mul(new BN("20")).div(new BN("100"));

      const daoShare = landPrice.sub(referrerShare);

      expect(daoBalanceAfter.sub(daoBalanceBefore)).to.bignumber.be.equal(
        daoShare
      );

      expect(
        referrerBalanceAfter.sub(referrerBalanceBefore)
      ).to.bignumber.be.equal(referrerShare);
    });

    it("Rewrites referrer", async () => {
      const landPriceRef = await gm.methods["getFee(uint256,address)"](
        1,
        user3,
        { from: user1 }
      );

      await gm.methods["claim(uint256[],address)"]([104], user3, {
        value: landPriceRef,
        from: user1,
      });

      const referrerStored = await gm.referrers(user1);
      expect(referrerStored).to.be.equal(user3);
    });

    it("Sets reward and discount for referrer", async () => {
      await gm.setReferrerSettings(user3, 20, 40);
      const referrerSettings = await gm.referrerSettings(user3);

      expect(referrerSettings.discount).to.bignumber.be.equal(new BN("20"));
      expect(referrerSettings.reward).to.bignumber.be.equal(new BN("40"));
    });

    it("Returns getFee with new discount", async () => {
      const landPrice = await gm.methods["getFee(uint256,address)"](1, user3, {
        from: user1,
      });

      expect(landPrice).to.be.bignumber.equal(
        new BN(web3.utils.toWei("0.1")).sub(
          new BN(web3.utils.toWei("0.1")).mul(new BN("20")).div(new BN("100"))
        )
      );
    });

    it("Referrer gets changed reward", async () => {
      let daoBalanceBefore = web3.utils.toBN(
        await web3.eth.getBalance("0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4")
      );
      let referrerBalanceBefore = web3.utils.toBN(
        await web3.eth.getBalance(user3)
      );

      const landPrice = await gm.methods["getFee(uint256)"](1, {
        from: user1,
      });

      await gm.claim([105], {
        value: landPrice,
        from: user1,
      });

      let daoBalanceAfter = web3.utils.toBN(
        await web3.eth.getBalance("0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4")
      );
      let referrerBalanceAfter = web3.utils.toBN(
        await web3.eth.getBalance(user3)
      );

      const referrerShare = landPrice.mul(new BN("40")).div(new BN("100"));

      const daoShare = landPrice.sub(referrerShare);

      expect(daoBalanceAfter.sub(daoBalanceBefore)).to.bignumber.be.equal(
        daoShare
      );

      expect(
        referrerBalanceAfter.sub(referrerBalanceBefore)
      ).to.bignumber.be.equal(referrerShare);
    });

    it("Returns correct referralsCount", async () => {
      const count1 = await gm.referralsCount(DAO);
      expect(count1).to.bignumber.be.equal(new BN("0"));

      const count2 = await gm.referralsCount(user2);
      expect(count2).to.bignumber.be.equal(new BN("1"));

      const count3 = await gm.referralsCount(user3);
      expect(count3).to.bignumber.be.equal(new BN("1"));
    });

    it("Returns correct referrerEarned", async () => {
      const earn1 = await gm.referrerEarned(DAO);
      const earn2 = await gm.referrerEarned(user2);
      const earn3 = await gm.referrerEarned(user3);
      console.log(earn1.toString(), earn2.toString(), earn3.toString());
    });
  });
});
