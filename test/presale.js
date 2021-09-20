const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const MarsColony = artifacts.require('MarsColony');

contract('presale', (accounts) => {
  const [owner, dao, notDao] = accounts;

  let marsColony;

  before(async () => {
    marsColony = await MarsColony.new(dao, 10, [owner, owner, owner], { from: owner });
  });

  it('default presale is on', async () => {
    const isPresale = await marsColony.isPresale();
    assert.equal(isPresale, true);
  });

  it('Claim one with presale price', async () => {
    const fee = 0.677 * 10 ** 18 / 2;
    const priceFetched = await marsColony.getPrice();
    const feeFetched = await marsColony.getFee(1);
    assert.equal(priceFetched, fee);
    assert.equal(feeFetched, fee);
    await marsColony.claimOne(100, {
      value: fee,
      from: owner,
    });
  });

  it('Only dao can end presale', async () => {
    const tx = marsColony.endPresale({ from: notDao });
    await truffleAssert.reverts(tx, 'Can be executed only by DAO');
    await marsColony.endPresale({ from: dao });
  });

  it('Claim one with normal price', async () => {
    const fee = 0.677 * 10 ** 18;
    const priceFetched = await marsColony.getPrice();
    const feeFetched = await marsColony.getFee(1);
    assert.equal(priceFetched, fee);
    assert.equal(feeFetched, fee);
    await marsColony.claimOne(101, {
      value: fee,
      from: owner,
    });
  });
});
