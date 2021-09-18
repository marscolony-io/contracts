const { assert } = require("chai");

const MarsColony = artifacts.require('MarsColony');

contract('supply', (accounts) => {
  const [owner, user1] = accounts;

  let marsColony;
  const TOTAL = 200;

  before(async () => {
    marsColony = await MarsColony.new(owner, 10, [owner, owner, owner], { from: owner });
    const tokens = [];
    const promises = [];
    for (let i = 1; i <= TOTAL; i = i + 1) {
      tokens.push(i);
      if (tokens.length >= 50) {
        await marsColony.claim(tokens, { value: tokens.length * 0.677 * 10 ** 18, from: user1 });
        tokens.splice(0, tokens.length);
      }
    }
    if (tokens.length > 0) {
      await marsColony.claim(tokens, { value: tokens.length * 0.677 * 10 ** 18, from: user1 });
    }
  });

  it('Total supply and all minted tokens', async () => {
    const totalSupply = await marsColony.totalSupply.call();
    assert.equal(totalSupply, TOTAL);
    const allMintedTokens = await marsColony.allTokens.call();
    assert.equal(allMintedTokens.length, TOTAL);
  });
});
