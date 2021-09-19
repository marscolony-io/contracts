const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const MarsColony = artifacts.require('MarsColony');

contract('claim test', (accounts) => {
  const [owner, dao, notUser] = accounts;

  let marsColony;
  let fee;

  before(async () => {
    marsColony = await MarsColony.new(dao, 10, [owner, owner, owner], { from: owner });
    const tokens = [1, 2, 3, 4, 5, 6, 7];
    fee = await marsColony.getFee(tokens.length);
    await marsColony.claim(tokens, {
      value: fee,
      from: owner,
    });
  });

  it('Withdraw', async () => {
    const daoBalance = await web3.eth.getBalance(dao);
    const tx = await marsColony.withdraw({ from: notUser });
    const newDaoBalance = await web3.eth.getBalance(dao);
    const txInfo = await web3.eth.getTransaction(tx.tx);
    assert.approximately(parseInt(fee), newDaoBalance - daoBalance, fee / 100000);
  });

  it('Withdraw value', async () => {
    const tokens = [11, 12, 13, 14, 15, 16, 17];
    fee = await marsColony.getFee(tokens.length);
    await marsColony.claim(tokens, {
      value: fee,
      from: owner,
    });
    const toWithdraw = 0.1 * 10 ** 18;
    const daoBalance = await web3.eth.getBalance(dao);
    await marsColony.withdrawValue(toWithdraw.toString(), { from: notUser });
    const newDaoBalance = await web3.eth.getBalance(dao);
    assert.approximately(newDaoBalance - daoBalance, toWithdraw, toWithdraw / 100000);
  });
});
