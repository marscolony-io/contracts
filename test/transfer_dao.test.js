const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const { time } = require('openzeppelin-test-helpers');

const GM = artifacts.require('GameManager');
const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');

contract('Transfer DAO', (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let mc;
  let clny;

  before(async () => {
    gm = await GM.deployed();
    clny = await CLNY.deployed();
    mc = await MC.deployed();
  });

  it('Transfer DAO', async () => {
    await gm.transferDAO(user1, { from: DAO });
    await truffleAssert.reverts(gm.transferDAO(user2, { from: DAO }), 'Only DAO');
    await clny.transferDAO(user1, { from: DAO });
    await truffleAssert.reverts(clny.transferDAO(user2, { from: DAO }), 'Only DAO');
    await mc.transferDAO(user1, { from: DAO });
    await truffleAssert.reverts(mc.transferDAO(user2, { from: DAO }), 'Only DAO');
  });
  

});
