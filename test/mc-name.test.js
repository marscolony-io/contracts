const { assert, expect } = require('chai');
const truffleAssert = require('truffle-assertions');
const { time, BN } = require('openzeppelin-test-helpers');

const GM = artifacts.require('GameManager');
const MC = artifacts.require('MC');
const CLNY = artifacts.require('CLNY');

contract('MC getName setName', (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let mc;

  before(async () => {
    gm = await GM.deployed();
    mc = await MC.deployed();
    await gm.setPrice(web3.utils.toWei('0.1'), { from: DAO });
  });

  it('Claim', async () => {
    const fee = await gm.getFee(1);
    await gm.claim([100], { value: fee, from: user1 });
  });

  it('Set name', async () => {
    await truffleAssert.reverts(mc.setName(100, 'test name', { from: user2 }), 'Not your token');
    await mc.setName(100, 'test name', { from: user1 });
  });

  it('Get name', async () => {
    expect(await mc.getName(100, { from: user2 })).to.be.equal('test name');
  });
});
