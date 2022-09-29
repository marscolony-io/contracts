const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const GameManagerFixed = artifacts.require('GameManagerFixed');

contract('Price', (accounts) => {
  const [owner, user1] = accounts;

  let gm;

  before(async () => {
    gm = await GameManagerFixed.deployed();
  });

  it('Get initial price', async () => {
    const price = await gm.price();
    assert.equal(price, 250 * 10 ** 18);
  });

  it('Set price by owner', async () => {
    await gm.setPrice(web3.utils.toWei('50'), { from: owner });
  });

  it('Revert when setting price not by owner', async () => {
    const tx = gm.setPrice(web3.utils.toWei('50'), { from: user1 });
    await truffleAssert.reverts(tx, 'Only owner');
  });

  it('Set price out of bounds', async () => {
    const tx = gm.setPrice(web3.utils.toWei('0.001'), { from: owner });
    await truffleAssert.reverts(tx, 'New price is out of bounds');
    const tx2 = gm.setPrice(web3.utils.toWei('1000000'), { from: owner });
    await truffleAssert.reverts(tx2, 'New price is out of bounds');
  });
});
