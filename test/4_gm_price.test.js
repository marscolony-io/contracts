const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const GM = artifacts.require('GameManager');

contract('Price', (accounts) => {
  const [DAO, user1] = accounts;

  let gm;

  before(async () => {
    gm = await GM.deployed();
  });

  it('Get initial price', async () => {
    const price = await gm.price();
    assert.equal(price, 250 * 10 ** 18);
  });

  it('Set price by DAO', async () => {
    await gm.setPrice(web3.utils.toWei('50'), { from: DAO });
  });

  it('Revert when setting price not by DAO', async () => {
    const tx = gm.setPrice(web3.utils.toWei('50'), { from: user1 });
    await truffleAssert.reverts(tx, 'Only DAO');
  });

  it('Set price out of bounds', async () => {
    const tx = gm.setPrice(web3.utils.toWei('0.01'), { from: DAO });
    await truffleAssert.reverts(tx, 'New price is out of bounds');
    const tx2 = gm.setPrice(web3.utils.toWei('1000000'), { from: DAO });
    await truffleAssert.reverts(tx2, 'New price is out of bounds');
  });
});
