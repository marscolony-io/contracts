const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const CLNY = artifacts.require('CLNY');

contract('CLNY', (accounts) => {
  const [DAO, user1] = accounts;

  let clny;

  before(async () => {
    clny = await CLNY.deployed();
  });

  it('Set DAO as game manager from DAO', async () => {
    await clny.setGameManager(DAO, { from: DAO });
  });

  const GM = DAO; // GameManager is set here

  it('Reverts when setting GM not from DAO', async () => {
    const tx = clny.setGameManager(user1, { from: user1 });
    await truffleAssert.reverts(tx, 'Only DAO');
  });

  it('Reverts when minting directly in mc not from GameManager', async () => {
    const tx = clny.mint(user1, 100, { from: user1 });
    await truffleAssert.reverts(tx, 'Only GameManager');
  });

  it('Mints from GM', async () => {
    await clny.mint(user1, 100, { from: GM });
  });

  it('Cannot pause not from DAO', async () => {
    const tx = clny.pause({ from: user1 });
    await truffleAssert.reverts(tx, 'Only GameManager');
  });

  it('Can pause from DAO', async () => {
    await clny.pause({ from: DAO });
  });

  // Paused from here

  it('Reverts when mints from GM while paused', async () => {
    const tx = clny.mint(user1, 100, { from: GM });
    await truffleAssert.reverts(tx, 'Pausable: paused');
  });

  it('Unpause and check minting', async () => {
    const tx = clny.unpause({ from: user1 });
    await truffleAssert.reverts(tx, 'Only GameManager');
    await clny.unpause({ from: DAO });
    await clny.mint(user1, 100, { from: GM });
  });

  // Already unpaused below

  it('Check final balances', async () => {
    const balance = await clny.balanceOf(user1, { from: user1 });
    assert.equal(balance, 200);
  });
});
