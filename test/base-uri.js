const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const MarsColony = artifacts.require('MarsColony');

contract('baseURI test', (accounts) => {
  const [owner, dao, notDao] = accounts;

  let marsColony;

  before(async () => {
    marsColony = await MarsColony.new(dao, 10, [owner, owner, owner], { from: owner });
    await marsColony.claimOne(1, { value: 0.677 * 10 ** 18 });
  });

  it('Check initial baseURI', async () => {
    const tokenURI = await marsColony.tokenURI(1);
    assert.equal(tokenURI, 'https://meta.marscolony.io/1');
  });

  it('Change baseURI by a dao', async () => {
    const newURI = 'https://google.com/';
    await marsColony.setBaseURI(newURI, { from: dao });
    const tokenURI = await marsColony.tokenURI(1);
    assert.equal(tokenURI, newURI + '1');
  });

  it('Try to change baseURI by not a dao', async () => {
    const newURI = 'https://google.com/';
    const tx = marsColony.setBaseURI(newURI, { from: notDao });
    await truffleAssert.reverts(tx, '');
  });
});
