const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const MarsColony = artifacts.require('MarsColony');

contract('claim test', (accounts) => {
  const [owner, user1] = accounts;

  let marsColony;
  const TOKEN = 100;

  before(async () => {
    marsColony = await MarsColony.new(owner, 10, [owner, owner, owner], { from: owner });
  });

  it('Claim one: #100', async () => {
    const fee = await marsColony.getFee(1);
    const tx = await marsColony.claimOne(TOKEN, {
      value: fee,
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

  it('Check metadata of #100', async () => {
    const tokenURI = await marsColony.tokenURI(TOKEN);
    assert(typeof tokenURI === 'string');
    assert(tokenURI !== '');
    assert(tokenURI.startsWith('https://'));
  });

  it('[Maximum token id is 21000] Claim #21003', async () => {
    const fee = await marsColony.getFee(1);
    const tx = marsColony.claimOne(21003, {
      from: owner,
      value: fee,
    });
    await truffleAssert.reverts(tx, 'Maximum token id is 21000');
  });

  it('[Token id must be over zero] Claim #0', async () => {
    const fee = await marsColony.getFee(1);
    const tx = marsColony.claimOne(0, {
      from: owner,
      value: fee,
    });
    await truffleAssert.reverts(tx, 'Token id must be over zero');
  });

  it('Claim several: [#102, #104]', async () => {
    const fee = await marsColony.getFee(2);
    const tx = await marsColony.claim([102, 104], {
      value: fee,
      from: user1,
    });
    assert(await marsColony.ownerOf.call(102) === user1);
    assert(await marsColony.ownerOf.call(104) === user1);
    truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
      return ev.from === '0x0000000000000000000000000000000000000000'
        && ev.to === user1
        && parseInt(ev.tokenId) === 102;
    });
    truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
      return ev.from === '0x0000000000000000000000000000000000000000'
        && ev.to === user1
        && parseInt(ev.tokenId) === 104;
    });
  });

  it('[You can\'t claim 0 tokens] Claim several: []', async () => {
    const tx = marsColony.claim([], {
      from: user1,
    });
    await truffleAssert.reverts(tx, 'You can\'t claim 0 tokens');
  });

  it('[You can\'t claim more than 100 tokens] Claim more than 100 pcs: [201, 202, ..., 301, 302]', async () => {
    const tx = marsColony.claim([...new Array(101)].map((_, index) => 201 + index), {
      from: user1,
    });
    await truffleAssert.reverts(tx, 'You can\'t claim more than 100 tokens');
  });

  it('[Wrong claiming fee] Claim', async () => {
    const tx = marsColony.claimOne(222, {
      from: owner,
      value: 0.666 * 10 ** 18, // wrong
    });
    await truffleAssert.reverts(tx, 'Wrong claiming fee');
  });

  it('[Wrong claiming fee] Claim several', async () => {
    const tx = marsColony.claim([222, 333], {
      from: owner,
      value: 2 * 0.666 * 10 ** 18 + 1, // wrong
    });
    await truffleAssert.reverts(tx, 'Wrong claiming fee');
  });
});
