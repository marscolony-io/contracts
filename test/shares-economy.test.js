const { assert, expect } = require('chai');
const { time, ether } = require('openzeppelin-test-helpers');

const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');
const GM = artifacts.require('GameManager');

contract('Shares economy', (accounts) => {
  const [owner, user1, user2] = accounts;

  let mc;
  let clny;
  let gm;

  before(async () => {
    clny = await CLNY.deployed();
    mc = await MC.deployed();
    gm = await GM.deployed();
    await gm.setPrice(web3.utils.toWei('0.1'), { from: owner });
    await gm.setClnyPerSecond(ether('6000').div(new web3.utils.BN(60 * 60 * 24)));
    await time.increase(time.duration.weeks(4)); // should have zero emission as zero tokens
  });

  it('Claim one: #100', async () => {
    const fee = await gm.getFee(3);
    expect(+await gm.totalShare()).to.be.equal(0);
    await gm.claim([100, 101, 102], { value: fee, from: user1 });
  });

  it('Wait 24h and claim earned', async () => {
    await time.increase(60 * 60 * 24 * 1);
    await gm.claimEarned([100, 101, 102], { from: user1 }); // 1 day - 5000 CLNY
    expect(+await gm.totalShare()).to.be.equal(3);
    // TODO USER1 SHARES
    const b = await clny.balanceOf(user1);
    expect(b * 1e-18).to.be.above(6000);
    expect(b * 1e-18).to.be.below(6001);
    const fee = await gm.getFee(3);
    await gm.claim([201, 202, 203], { value: fee, from: user2 });
    expect(+await gm.totalShare()).to.be.equal(6);
  });

  it('Wait 24h and claim earned [2]', async () => {
    await time.increase(60 * 60 * 24 * 1);
    await gm.claimEarned([201, 202, 203], { from: user2 });
    await gm.claimEarned([100, 101, 102], { from: user1, gas: 5000000, gasPrice: 500000000 });
    const a = await clny.balanceOf(user1);
    const b = await clny.balanceOf(user2);
    const x = await gm.logged();
    console.log(x * 1e-18)
    console.log(a * 1e-18, b * 1e-18);
    // await gm.claim([102, 103, 202], { value: fee, from: user1 });
  });
});
