const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const MC = artifacts.require('MC');

contract('MC', (accounts) => {
  const [DAO, user1, user2] = accounts;

  let mc;

  before(async () => {
    mc = await MC.deployed();
  });

  it('Set DAO as game manager from DAO', async () => {
    await mc.setGameManager(DAO, { from: DAO });
  });

  const GM = DAO; // GameManager is set here

  it('Reverts when setting GM not from DAO', async () => {
    const tx = mc.setGameManager(user1, { from: user1 });
    await truffleAssert.reverts(tx, 'Only DAO');
  });

  it('Reverts when minting directly in mc not from GameManager', async () => {
    const tx = mc.mint(user1, 456, { from: user1 });
    await truffleAssert.reverts(tx, 'Only GameManager');
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

  it('Cannot pause not from DAO', async () => {
    const tx = mc.pause({ from: user1 });
    await truffleAssert.reverts(tx, 'Only GameManager');
  });

  it('Can pause from DAO', async () => {
    await mc.pause({ from: DAO });
  });

  // Paused from here

  it('Reverts when mints from GM while paused', async () => {
    const tx = mc.mint(user1, 457, { from: GM });
    await truffleAssert.reverts(tx, 'Pausable: paused');
  });

  it('Unpause and check minting', async () => {
    const tx = mc.unpause({ from: user1 });
    await truffleAssert.reverts(tx, 'Only GameManager');
    await mc.unpause({ from: DAO });
    await mc.mint(user1, 457, { from: GM });
  });

  // Already unpaused below

  it('DAO changes base URI', async () => {
    await mc.setBaseURI('https://yahoo.com/', { from: DAO });
    const tokenURI = await mc.tokenURI(456);
    assert.equal(tokenURI, 'https://yahoo.com/456');
  });

  it('Not DAO cannot change base URI', async () => {
    const tx = mc.setBaseURI('https://google.com/', { from: user1 });
    await truffleAssert.reverts(tx, 'Only DAO');
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
