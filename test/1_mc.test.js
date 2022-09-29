
const { assert } = require('chai');
const { expectRevert } = require('openzeppelin-test-helpers');

const MC = artifacts.require('MC');
const Dependencies = artifacts.require('Dependencies');

contract('MC', (accounts) => {
  const [owner, user1, user2] = accounts;

  let mc;
  let d;

  before(async () => {
    mc = await MC.deployed();
    d = await Dependencies.deployed();
  });

  it('Set owner as game manager from owner', async () => {
    await d.setGameManager(owner, { from: owner });
  });

  const GM = owner; // GameManager is set here

  it('Reverts when minting directly in mc not from GameManager', async () => {
    await expectRevert(mc.mint(user1, 456, { from: user1 }), 'Only game manager');
  });

  it('allMyTokens - zero', async () => {
    const allMyTokens = await mc.allMyTokens({ from: user1 });
    assert.lengthOf(allMyTokens, 0);
  });

  it('Mints from GM', async () => {
    await mc.mint(user2, 456, { from: GM });
  });

  it('Check metadata', async () => {
    const tokenURI = await mc.tokenURI(456);
    assert.equal(tokenURI, 'https://meta.marscolony.io/456');
  });

  it('Cannot pause not from owner', async () => {
    await expectRevert(mc.pause({ from: user1 }), 'Only game manager');
  });

  it('Can pause from owner', async () => {
    await mc.pause({ from: owner });
  });

  // Paused from here

  it('Reverts when mints from GM while paused', async () => {
    await expectRevert(mc.mint(user1, 457, { from: GM }), 'Pausable: paused');
  });

  it('Unpause and check minting', async () => {
    await expectRevert(mc.unpause({ from: user1 }), 'Only game manager');
    await mc.unpause({ from: owner });
    await mc.mint(user1, 457, { from: GM });
  });

  // Already unpaused below

  it('Owner changes base URI', async () => {
    await mc.setBaseURI('https://yahoo.com/', { from: owner });
    const tokenURI = await mc.tokenURI(456);
    assert.equal(tokenURI, 'https://yahoo.com/456');
  });

  it('Not owner cannot change base URI', async () => {
    await expectRevert(mc.setBaseURI('https://google.com/', { from: user1 }), 'Only owner');
  });

  it('Check allTokensPaginate view function', async () => {
    const allTokens = await mc.allTokensPaginate(0, 0);
    assert.lengthOf(allTokens, 1); // [456]
    assert.includeMembers(allTokens.map(n => parseInt(n)), [456]);
    const allTokens1 = await mc.allTokensPaginate(1, 1);
    assert.lengthOf(allTokens1, 1); // [457]
    assert.includeMembers(allTokens1.map(n => parseInt(n)), [457]);
    const allTokens2 = await mc.allTokensPaginate(10, 100);
    assert.lengthOf(allTokens2, 0);
    const allTokens3 = await mc.allTokensPaginate(1000, 100);
    assert.lengthOf(allTokens3, 0);
    const allTokens4 = await mc.allTokensPaginate(0, 10);
    assert.lengthOf(allTokens4, 2); // [456, 457]
    assert.includeMembers(allTokens4.map(n => parseInt(n)), [456, 457]);
  });

  it('Check allMyTokens view function', async () => {
    const allMyTokens = await mc.allMyTokens({ from: user1 });
    assert.lengthOf(allMyTokens, 1); // [457]
    assert.includeMembers(allMyTokens.map(n => parseInt(n)), [457]);
  });
});
