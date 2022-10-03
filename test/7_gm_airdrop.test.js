const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const GameManagerFixed = artifacts.require('GameManagerFixed');
const MC = artifacts.require('MC');

contract('Airdrop', (accounts) => {
  const [owner, user1] = accounts;

  let gm;
  let mc;

  before(async () => {
    gm = await GameManagerFixed.deployed();
    mc = await MC.deployed();
  });

  it('Do airdrop', async () => {
    const tx = await gm.airdrop(user1, 1, { from: owner });
    const mcOwner = await mc.ownerOf.call(1);
    assert(mcOwner === user1);
    const mcTx = await truffleAssert.createTransactionResult(mc, tx.tx);
    truffleAssert.eventEmitted(mcTx, 'Transfer', (ev) => {
      return ev.from === '0x0000000000000000000000000000000000000000'
        && ev.to === user1
        && ev.tokenId.toString() === '1';
    });
  });
  
  it('Try airdrop not from owner', async () => {
    const tx = gm.airdrop(user1, 2, { from: user1 });
    truffleAssert.reverts(tx, 'Only owner');
  });
});
