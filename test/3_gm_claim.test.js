const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');
const GM = artifacts.require('GameManager');

contract('Claiming', (accounts) => {
  const [owner, user1, , , , proxyOwner] = accounts;

  const TOKEN = 100;
  let mc;
  let clny;
  let gm;

  before(async () => {
    clny = await CLNY.deployed();
    mc = await MC.deployed();
    gm = await GM.deployed();
    await gm.setPrice(web3.utils.toWei('0.1'), { from: owner });
  });

  it('Claim one: #100', async () => {
    const fee = await gm.getFee(1);
    const tx = await gm.claimOne(100, {
      value: fee,
      from: user1,
    });
    const owner100 = await mc.ownerOf.call(100);
    assert(owner100 === user1);
    const mcTx = await truffleAssert.createTransactionResult(mc, tx.tx);
    truffleAssert.eventEmitted(mcTx, 'Transfer', (ev) => {
      return ev.from === '0x0000000000000000000000000000000000000000'
        && ev.to === user1
        && ev.tokenId.toString() === '100';
    });
  });

  it('Check metadata of #100', async () => {
    const tokenURI = await mc.tokenURI(TOKEN);
    assert(tokenURI !== '');
    assert(tokenURI.startsWith('https://'));
  });

  it('[Token id out of bounds] Claim #21003', async () => {
    const fee = await gm.getFee(1);
    const tx = gm.claimOne(21003, {
      from: owner,
      value: fee,
    });
    await truffleAssert.reverts(tx, 'Token id out of bounds');
  });

  it('[Token id out of bounds] Claim #0', async () => {
    const fee = await gm.getFee(1);
    const tx = gm.claimOne(0, {
      from: owner,
      value: fee,
    });
    await truffleAssert.reverts(tx, 'Token id out of bounds');
  });

  it('Claim several: [#102, #104]', async () => {
    const fee = await gm.getFee(2);
    const tx = await gm.claim([102, 104], {
      value: fee,
      from: user1,
    });
    assert(await mc.ownerOf.call(102) === user1);
    assert(await mc.ownerOf.call(104) === user1);
    const mcTx = await truffleAssert.createTransactionResult(mc, tx.tx);
    truffleAssert.eventEmitted(mcTx, 'Transfer', (ev) => {
      return ev.from === '0x0000000000000000000000000000000000000000'
        && ev.to === user1
        && parseInt(ev.tokenId) === 102;
    });
    truffleAssert.eventEmitted(mcTx, 'Transfer', (ev) => {
      return ev.from === '0x0000000000000000000000000000000000000000'
        && ev.to === user1
        && parseInt(ev.tokenId) === 104;
    });
  });

  it('[You can\'t claim 0 tokens] Claim several: []', async () => {
    const tx = gm.claim([], {
      from: user1,
    });
    await truffleAssert.reverts(tx, 'You can\'t claim 0 tokens');
  });

  it('[Wrong claiming fee] Claim', async () => {
    const tx = gm.claimOne(222, {
      from: owner,
      value: 0.666 * 10 ** 18, // wrong
    });
    await truffleAssert.reverts(tx, 'Wrong claiming fee');
  });

  it('[Wrong claiming fee] Claim several', async () => {
    const tx = gm.claim([222, 333], {
      from: owner,
      value: 2 * 0.666 * 10 ** 18 + 1, // wrong
    });
    await truffleAssert.reverts(tx, 'Wrong claiming fee');
  });
});
