const { assert } = require("chai");

const MarsColony = artifacts.require('MarsColony');

contract('MarsColony', (accounts) => {
  const [owner] = accounts;

  let marsColony;

  before(async () => {
    marsColony = await MarsColony.new(owner, { from: owner });
  });

  it('DAO is public', async () => {
    const DAO = await marsColony.DAO.call();
    assert(DAO === owner);
  });
});
