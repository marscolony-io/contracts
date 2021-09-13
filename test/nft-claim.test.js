const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const MarsColony = artifacts.require('MarsColony');

contract('MarsColony', (accounts) => {
  const [owner, user1] = accounts;

  let marsColony;
  const TOKEN = 100;

  before(async () => {
    marsColony = await MarsColony.new(owner, { from: owner });
  });

  it('Should claim Land Plot #100 as user1', async () => {
    const tx = await marsColony.claim(TOKEN, {
      value: 0.677 * 10 ** 18,
      from: user1,
    });
    const owner100 = await marsColony.ownerOf.call(TOKEN);
    assert(owner100 === user1);
    truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
      return ev.from === '0x0000000000000000000000000000000000000000'
        && ev.to === user1
        && ev.tokenId.toString() === TOKEN.toString();
    });
  });

  it('Check metadata of the token', async () => {
    const tokenURI = await marsColony.tokenURI(TOKEN);
    assert(typeof tokenURI === 'string');
    assert(tokenURI !== '');
    assert(tokenURI.startsWith('https://'));
  });
});
