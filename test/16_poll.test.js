const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GM = artifacts.require("GameManager");
const CLNY = artifacts.require("CLNY");
const AvatarManager = artifacts.require("AvatarManager");
const NFT = artifacts.require("MartianColonists");
const Poll = artifacts.require("Poll");
const MC = artifacts.require("MC");

contract("Poll", (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let poll;

  before(async () => {
    gm = await GM.deployed();
    poll = await Poll.deployed();
    await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
    await gm.claim([100, 101, 102], { value: web3.utils.toWei("0.3"), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
  });

  describe("Do votes", function() {
    it("Can vote; starting", async () => {
      {
        const { '4': canVote1 } = await gm.getPollData({ from: user1 });
        expect(canVote1).to.be.false;
        const { '4': canVote2 } = await gm.getPollData({ from: user2 });
        expect(canVote2).to.be.false;
      }
      await poll.start();
      {
        const { '4': canVote1 } = await gm.getPollData({ from: user1 });
        expect(canVote1).to.be.true;
        const { '4': canVote2 } = await gm.getPollData({ from: user2 });
        expect(canVote2).to.be.true;
      }
    });

    it("Vote and check", async () => {
      await gm.vote(0, { from: user1 });
      await gm.vote(1, { from: user2 });
      const totalFor0 = +await poll.totalVotesFor(0);
      const totalFor1 = +await poll.totalVotesFor(1);
      expect(totalFor0).to.be.equal(3);
      expect(totalFor1).to.be.equal(1);
    });

    it("Vote again", async () => {
      await gm.vote(0, { from: user1 });
      await gm.vote(1, { from: user2 });
      {
        const totalFor0 = +await poll.totalVotesFor(0);
        const totalFor1 = +await poll.totalVotesFor(1);
        expect(totalFor0).to.be.equal(3);
        expect(totalFor1).to.be.equal(1);
      }
      await gm.claim([104], { value: web3.utils.toWei("0.1"), from: user1 });
      await gm.claim([201, 202], { value: web3.utils.toWei("0.2"), from: user2 });
      await gm.vote(0, { from: user1 });
      await gm.vote(1, { from: user2 });
      {
        const totalFor0 = +await poll.totalVotesFor(0);
        const totalFor1 = +await poll.totalVotesFor(1);
        expect(totalFor0).to.be.equal(4);
        expect(totalFor1).to.be.equal(3);
      }
    });
  });
});
