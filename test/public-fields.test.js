const { assert } = require("chai");

const MarsColony = artifacts.require('MarsColony');

contract('public fields', (accounts) => {
  const [owner, user1] = accounts;

  let marsColony;

  before(async () => {
    marsColony = await MarsColony.new(owner, 10, [owner, owner, owner], { from: owner });
  });

  it('DAO is public', async () => {
    const DAO = await marsColony.DAO.call();
    assert(DAO === owner);
  });
});
