const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const GameManagerFixed = artifacts.require('GameManagerFixed');
const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');

contract('Pause', (accounts) => {
  const [DAO, user1] = accounts;

  let gm;
  let mc;
  let clny;

  before(async () => {
    gm = await GameManagerFixed.deployed();
    mc = await MC.deployed();
    clny = await CLNY.deployed();
    await gm.setPrice(web3.utils.toWei('0.1'));
  });

  it('Pause', async () => {
    const tx = gm.pause({ from: user1 });
    truffleAssert.reverts(tx, 'Only DAO');
    await gm.pause({ from: DAO });
    const paused = await gm.paused();
    assert.equal(paused, true);
    const mcPaused = await mc.paused();
    assert.isTrue(mcPaused);
    const clnyPaused = await mc.paused();
    assert.isTrue(clnyPaused);
  });
  
  it('Unpause', async () => {
    const tx = gm.unpause({ from: user1 });
    truffleAssert.reverts(tx, 'Only DAO');
    await gm.unpause({ from: DAO });
    const paused = await gm.paused();
    assert.isFalse(paused);
    const mcPaused = await mc.paused();
    assert.isFalse(mcPaused);
    const clnyPaused = await mc.paused();
    assert.isFalse(clnyPaused);
  });
});
