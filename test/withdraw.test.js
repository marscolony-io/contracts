const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const { time, BN } = require('openzeppelin-test-helpers');

const GM = artifacts.require('GameManager');
const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');

contract('Withdraw', (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let mc;

  before(async () => {
    gm = await GM.deployed();
    await gm.setPrice(web3.utils.toWei('2'), { from: DAO });
  });

  it('Claim', async () => {
    const fee = await gm.getFee(1);
    await gm.claim([100], { value: fee, from: user1 });
  });
  
  it('Withdraw value', async () => {
    await truffleAssert.reverts(gm.withdrawValue(web3.utils.toWei('1'), { from: user1 }), 'Only DAO');
    await gm.withdrawValue(web3.utils.toWei('1'), { from: DAO });
  });

  it('Withdraw all', async () => {
    await truffleAssert.reverts(gm.withdraw({ from: user1 }), 'Only DAO');
    await gm.withdraw({ from: DAO });
  });
});
