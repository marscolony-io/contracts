const { assert, expect } = require('chai');
const { time, expectRevert } = require('openzeppelin-test-helpers');
const { BN } = require('bn.js');
const truffleAssertions = require('truffle-assertions');

const GM = artifacts.require('GameManager');
const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');

contract('Set treasury and liquidity', (accounts) => {
  const [DAO, treasury, liquidity, user1, user2] = accounts;

  let gm;
  let clny;

  before(async () => {
    gm = await GM.deployed();
    clny = await CLNY.deployed();
  });

  it('Set treasury', async () => {
    await truffleAssertions.reverts(gm.setTreasury(user1, { from: user2 }), 'Only DAO');
    await gm.setTreasury(user1, { from: DAO });
  });

  it('Set liquidity', async () => {
    await truffleAssertions.reverts(gm.setLiquidity(user1, { from: user2 }), 'Only DAO');
    await gm.setLiquidity(user1, { from: DAO });
  });
});
