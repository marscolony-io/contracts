const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const { time } = require('openzeppelin-test-helpers');

const GM = artifacts.require('GameManager');
const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');

contract('Burn initial liquidity test', (accounts) => {
  const [DAO, treasury, liquidity, user1] = accounts;

  let gm;
  let clny;

  before(async () => {
    gm = await GM.deployed();
    clny = await CLNY.deployed();
  });

  it('Mint enough CLNY', async () => {
    await gm.airdrop(user1, 1, { from: DAO });

    await time.increase(60 * 60 * 24 * 365); // 1 year for example

    await gm.claimEarned([1], { from: user1 });

    const balance = await clny.balanceOf(treasury);

    for (let i = 0; i < 10; i++) {
      await gm.burn10kTreasury({ from: DAO });
    }

    const newBalance = await clny.balanceOf(treasury);

    assert.equal(balance * 1e-18 - 100, newBalance * 1e-18);

  });
  

});
