const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const { time } = require('openzeppelin-test-helpers');
const { BN } = require('bn.js');

const GM = artifacts.require('GameManager');
const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');

contract('Burn initial tresury test', (accounts) => {
  const [DAO, treasury, liquidity, user1] = accounts;

  let gm;
  let clny;

  before(async () => {
    gm = await GM.deployed();
    clny = await CLNY.deployed();
  });

  it('Burn CLNY', async () => {
    await gm.airdrop(user1, 1, { from: DAO });

    await time.increase(60 * 60 * 24 * 365 * 1000); // 1 year for example

    await gm.claimEarned([1], { from: user1 });

    const balance = await clny.balanceOf(treasury);

    await gm.burnTreasury(100000 + ''.padStart(18, '0'), { from: DAO });

    const newBalance = await clny.balanceOf(treasury);

    assert.equal(
      (balance * 1e-18 - 100_000).toFixed(10),
      (newBalance * 1e-18).toFixed(10),
    );

  });
  

});
