const truffleAssert = require('truffle-assertions');

const GameManagerFixed = artifacts.require('GameManagerFixed');

contract('Withdraw', (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;

  before(async () => {
    gm = await GameManagerFixed.deployed();
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
});
