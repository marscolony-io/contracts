const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const GM = artifacts.require('GameManager');
const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');

contract('Airdrop', (accounts) => {
  const [DAO, user1] = accounts;

  let gm;
  let mc;

  before(async () => {
    gm = await GM.deployed();
    mc = await MC.deployed();
  });

  it('Do airdrop', async () => {
    const tx = await gm.airdrop(user1, 1, { from: DAO });
    const owner = await mc.ownerOf.call(1);
    assert(owner === user1);
    const mcTx = await truffleAssert.createTransactionResult(mc, tx.tx);
    truffleAssert.eventEmitted(mcTx, 'Transfer', (ev) => {
      return ev.from === '0x0000000000000000000000000000000000000000'
        && ev.to === user1
        && ev.tokenId.toString() === '1';
    });
  });
  
  it('Try airdrop not from DAO', async () => {
    const tx = gm.airdrop(user1, 2, { from: user1 });
    truffleAssert.reverts(tx, 'Only DAO');
  });
});
