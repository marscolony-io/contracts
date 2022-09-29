const { assert } = require('chai');
const { expectRevert } = require('openzeppelin-test-helpers');

const CLNY = artifacts.require('CLNY');
const Dependencies = artifacts.require('Dependencies');

contract('CLNY', (accounts) => {
  const [owner, user1] = accounts;

  let clny;
  let d;

  before(async () => {
    clny = await CLNY.deployed();
    d = await Dependencies.deployed();
  });

  it('Set DAO as game manager from owner', async () => {
    await d.setGameManager(owner, { from: owner });
  });

  const GM = owner; // GameManager is set here

  it('Reverts when minting directly in mc not from GameManager', async () => {
    await expectRevert(clny.mint(user1, 100, 1, { from: user1 }), 'Only game manager');
  });

  it('Mints from GM', async () => {
    await clny.mint(user1, 100, 1, { from: GM });
  });

  it('Cannot pause not from owner', async () => {
    await expectRevert(clny.pause({ from: user1 }), 'Only game manager');
  });

  it('Can pause from owner', async () => {
    await clny.pause({ from: owner });
  });

  // Paused from here

  it('Reverts when mints from GM while paused', async () => {
    await expectRevert(clny.mint(user1, 100, 1, { from: GM }), 'Pausable: paused');
  });

  it('Unpause and check minting', async () => {
    await expectRevert(clny.unpause({ from: user1 }), 'Only game manager');
    await clny.unpause({ from: owner });
    await clny.mint(user1, 100, 1, { from: GM });
  });

  // Already unpaused below

  it('Check final balances', async () => {
    const balance = +await clny.balanceOf(user1, { from: user1 });
    assert.equal(balance, 200);
  });
});
