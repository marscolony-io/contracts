const { assert, expect } = require('chai');
const truffleAssert = require('truffle-assertions');
const { time, BN, expectRevert } = require('openzeppelin-test-helpers');

const GameManagerFixed = artifacts.require('GameManagerFixed');
const CLNY = artifacts.require('CLNY');
const CollectionManager = artifacts.require('CollectionManager');
const NFT = artifacts.require('MartianColonists');
const MSN = artifacts.require('MissionManager');
const MC = artifacts.require('MC');
const Dependencies = artifacts.require('Dependencies');

contract('GameManagerFixed', accounts => {
  const [owner, user1, user2, user3] = accounts;

  let gm;
  let clny;
  let collection;
  let nft;
  let msn;
  let mc;
  let d;

  before(async () => {
    gm = await GameManagerFixed.deployed();
    clny = await CLNY.deployed();
    collection = await CollectionManager.deployed();
    nft = await NFT.deployed();
    msn = await MSN.deployed();
    mc = await MC.deployed();
    d = await Dependencies.deployed();
    await collection.setMaxTokenId(5);
    await gm.setPrice(web3.utils.toWei('0.1'), { from: owner });
    await gm.claim([100], { value: web3.utils.toWei('0.1'), from: user1 });
    await time.increase(60 * 60 * 24 * 365.25 * 1000); // wait 10 years
    await gm.claimEarned([100], { from: user1 }); // claim 3652.5 clny
  });

  describe('repairTransport()', function() {
    it('only allowed repair amounts', async () => {
      await truffleAssert.reverts(gm.repairTransport(105, { from: user1 }), 'wrong repair amount');
    });

    it('increase on 25 percents', async () => {
      const balanceBefore = await clny.balanceOf(user1);
      // console.log({ balanceBefore: parseInt(balanceBefore) });
      await gm.repairTransport(25, { from: user1 });
      const condition = await collection.getTransportCondition(user1);
      expect(condition).to.bignumber.be.equal(new BN(750));
      const balanceAfter = await clny.balanceOf(user1);
      // console.log({ balanceAfter: parseInt(balanceAfter) });
      expect(balanceBefore.sub(balanceAfter)).to.bignumber.be.equal(new BN('1500000000000000000'));
    });

    it('no money to repair', async () => {
      await truffleAssert.reverts(gm.repairTransport(25, { from: user2 }), 'ERC20: burn amount exceeds balance');
    });
  });
});
