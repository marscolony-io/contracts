const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const MarsColony = artifacts.require('MarsColony');

contract('Pausable test', (accounts) => {
  const [owner, user1] = accounts;

  let marsColony;
  const TOKEN = 100;

  before(async () => {
    marsColony = await MarsColony.new(owner, 10, [owner, owner, owner], { from: owner });
    // let's pause at start
    await marsColony.pause({ from: owner });
  });

  it('[paused] Revert on claim', async () => {
    const tx = marsColony.claimOne(TOKEN, {
      value: 0.677 * 10 ** 18,
      from: user1,
    });
    await truffleAssert.reverts(tx, 'Pausable: paused');
  });

  it('[paused] Revert on airdrop', async () => {
    const tx = marsColony.airdrop(user1, 100, {
      from: owner,
    });
    await truffleAssert.reverts(tx, 'Pausable: paused');
  });

  it('only dao can unpause', async () => {
    const tx = marsColony.unpause({ from: user1 });
    await truffleAssert.reverts(tx, 'Can be executed only by DAO');
  });

  it('[unpaused] No revert', async () => {
    await marsColony.unpause({ from: owner });
    await marsColony.airdrop(user1, 100, {
      from: owner,
    });
    const fee = await marsColony.getFee(1);
    await marsColony.claimOne(101, {
      value: fee,
      from: user1,
    });
  });

  it('only dao can pause', async () => {
    const tx = marsColony.pause({ from: user1 });
    await truffleAssert.reverts(tx, 'Can be executed only by DAO');
  });
});
