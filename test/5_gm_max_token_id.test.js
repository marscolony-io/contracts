const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const GM = artifacts.require('GameManager');
const MC = artifacts.require('MC');

contract('maxTokenId', (accounts) => {
  const [DAO, user1] = accounts;

  let gm;
  let mc;

  before(async () => {
    gm = await GM.deployed();
    mc = await MC.deployed();
    await gm.setPrice(web3.utils.toWei('0.1'));
  });
  
  it('[Token id out of bounds] Claim #21003', async () => {
    const fee = await gm.getFee(1);
    const tx = gm.claimOne(21003, {
      from: DAO,
      value: fee,
    });
    await truffleAssert.reverts(tx, 'Token id out of bounds');
  });

  it('Set max token id of 22000 from DAO', async () => {
    await gm.setMaxTokenId(22000, { from: DAO });
  });

  it('Revert set max token id of 23000 from not a DAO', async () => {
    const tx = gm.setMaxTokenId(22000, { from: user1 });
    await truffleAssert.reverts(tx, 'Only DAO');
  });

  it('Claim #21999', async () => {
    const fee = await gm.price();
    const tx = await gm.claimOne(21999, {
      value: fee,
      from: user1,
    });
    const owner100 = await mc.ownerOf.call(21999);
    assert(owner100 === user1);
    const mcTx = await truffleAssert.createTransactionResult(mc, tx.tx);
    truffleAssert.eventEmitted(mcTx, 'Transfer', (ev) => {
      return ev.from === '0x0000000000000000000000000000000000000000'
        && ev.to === user1
        && ev.tokenId.toString() === Number(21999).toString();
    });
  });

  it('[Token id out of bounds] Claim #22003', async () => {
    const fee = await gm.getFee(1);
    const tx = gm.claimOne(22003, {
      from: DAO,
      value: fee,
    });
    await truffleAssert.reverts(tx, 'Token id out of bounds');
  });
});
