const { expect } = require('chai');
const { time, ether } = require('openzeppelin-test-helpers');

const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');
const GameManagerShares = artifacts.require('GameManagerShares');
const Dependencies = artifacts.require('Dependencies');

contract('Shares economy', (accounts) => {
  const [owner, user1, user2, , , , treasury, liquidity] = accounts;

  let mc;
  let clny;
  let gm;
  let d;

  before(async () => {
    clny = await CLNY.deployed();
    mc = await MC.deployed();
    gm = await GameManagerShares.deployed();
    d = await Dependencies.deployed();
    await d.setGameManager(GameManagerShares.address);
    await gm.setPrice(web3.utils.toWei('0.1'), { from: owner });
    await gm.setClnyPerSecond(ether('6000').div(new web3.utils.BN(60 * 60 * 24)));
    await gm.claim([99], { value: await gm.getFee(1), from: user1 });
    await time.increase(time.duration.weeks(4)); // should have zero emission as zero tokens
    await gm.claimEarned([99], { from: user1 });
  });

  it('Claim one: #100', async () => {
    const fee = await gm.getFee(3);
    expect(+await gm.totalShare()).to.be.equal(1);
    expect(+await gm.getEarningSpeed(100)).to.be.equal(0);
    await gm.claim([100, 101, 102], { value: fee, from: user1 });
    expect(+await gm.getEarningSpeed(100)).to.be.equal(1);
  });

  it('Wait 24h and claim earned', async () => {
    await time.increase(60 * 60 * 24 * 1);
    await gm.claimEarned([100, 101, 102], { from: user1 }); // 1 day - 6000 CLNY
    expect(+await gm.totalShare()).to.be.equal(4);
    const fee = await gm.getFee(3);
    await gm.claim([201, 202, 203], { value: fee, from: user2 });
    expect(+await gm.totalShare()).to.be.equal(7);
  });

  it('Wait 24h and claim earned [2]', async () => {
    await time.increase(60 * 60 * 24 * 1);
    await gm.claimEarned([201, 202, 203], { from: user2 });
    await gm.claimEarned([100, 101, 102], { from: user1, gas: 5000000, gasPrice: 500000000 });
    const a = await clny.balanceOf(user1);
    const b = await clny.balanceOf(user2);
    // const x = await gm.logged();
    // console.log(x * 1e-18)
    console.log(a * 1e-18, b * 1e-18);
    const userBalance = +await clny.balanceOf(user1) * 1e-18;
    const trBalance = +await clny.balanceOf(treasury) * 1e-18;
    const liqBalance = +await clny.balanceOf(liquidity) * 1e-18;
    console.log({ userBalance, trBalance, liqBalance });
    await gm.buildAndPlaceBaseStation(100, 3, 3, { from: user1 }); // +1 share - -30 clny
    expect(+await clny.balanceOf(user1) * 1e-18).to.be.approximately(175041, 1);
    await gm.buildAndPlacePowerProduction(100, 3, 3, { from: user1 }); // +1 share - -60 clny
    expect(+await clny.balanceOf(user1) * 1e-18).to.be.approximately(175041 - 60, 1);
    await gm.buildPowerProduction(100, 2, { from: user1 }); // +1 share - -120 clny
    expect(+await clny.balanceOf(user1) * 1e-18).to.be.approximately(175041 - 60 - 120, 1);
    await gm.buildPowerProduction(100, 3, { from: user1 }); // +2 shares - -240 clny
    expect(+await clny.balanceOf(user1) * 1e-18).to.be.approximately(175041 - 60 - 120 - 240, 1);
  });

  it('Check treasury and liquidity wallets', async () => {
    expect(+await clny.balanceOf(treasury) * 1e-18).to.be.approximately(112386, 1);
  });
});
