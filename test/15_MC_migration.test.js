const { expectRevert } = require('openzeppelin-test-helpers');

const MC = artifacts.require('MC');

contract('MC migration', (accounts) => {
  const [owner, user1, user2] = accounts;

  let mc;

  before(async () => {
    mc = await MC.deployed();
  });

  it('Check migration method', async () => {
    await mc.migrationMint([], [], false); // should be ok, does nothing
    await mc.migrationMint([user1, user1, user2], [1, 2, 3], false); // mints 3 tokens
    await expectRevert(mc.migrationMint([user1, user2], [4, 5, 6], false), 'Invalid array sizes');
    await expectRevert(mc.migrationMint([user1, user1, user2], [1, 2, 3], false), 'ERC721: token already minted'); // mints existing tokens
    await mc.migrationMint([user1, user1, user2], [5, 6, 7], true); // mints and closes mint
    await expectRevert(mc.migrationMint([user1, user2], [8, 9], false), 'Migration finished'); // already closed above

  });
});
