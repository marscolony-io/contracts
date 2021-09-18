const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const MarsColony = artifacts.require('MarsColony');

contract('airdrop test [MAX = 3]', (accounts) => {
  const [owner, user1, user2, user3] = accounts;

  let marsColony;
  const MAX_AIRDROPS = 3;

  const SOME_ADDRESS = [
    '0x35263D5B2e24b8FE955B83C5735843E1aD34dE9d',
    '0x04077e97b8169e8A603eb21a009De45c68F58ccB',
    '0x568945E5F0FA8409beb2F3a53842ECd2798B62c2',
    '0xab5801a7d398351b8be11c439e05c5b3259aec9b', // Vb :)
    '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8',
    '0x73bceb1cd57c711feac4224d062b0f6ff338501e',
  ]

  before(async () => {
    marsColony = await MarsColony.new(owner, MAX_AIRDROPS, [owner, user1, user2], { from: owner });
  });

  it('Airdrop #100: first address <- first airdropper', async () => {
    const tx = await marsColony.airdrop(SOME_ADDRESS[0], 100, {
      from: owner,
    });
    const owner100 = await marsColony.ownerOf.call(100);
    assert(owner100 === SOME_ADDRESS[0]);
    truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
      return ev.from === '0x0000000000000000000000000000000000000000'
        && ev.to === SOME_ADDRESS[0]
        && parseInt(ev.tokenId) === 100;
    });
    truffleAssert.eventEmitted(tx, 'Airdrop', (ev) => {
      return ev.initiator === owner
        && ev.receiver === SOME_ADDRESS[0]
        && parseInt(ev.tokenId) === 100;
    });
  });

  it('[Maximum token id is 21000] Airdrop #21003', async () => {
    const tx = marsColony.airdrop(SOME_ADDRESS[0], 21003, {
      from: owner,
    });
    await truffleAssert.reverts(tx, 'Maximum token id is 21000');
  });

  it('[Token id must be over zero] Airdrop #0', async () => {
    const tx = marsColony.airdrop(SOME_ADDRESS[0], 0, {
      from: owner,
    });
    await truffleAssert.reverts(tx, 'Token id must be over zero');
  });

  it('Airdrop #101: second address <- second airdropper', async () => {
    const tx = await marsColony.airdrop(SOME_ADDRESS[1], 101, {
      from: user1,
    });
    const owner100 = await marsColony.ownerOf.call(101);
    assert(owner100 === SOME_ADDRESS[1]);
    truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
      return ev.from === '0x0000000000000000000000000000000000000000'
        && ev.to === SOME_ADDRESS[1]
        && parseInt(ev.tokenId) === 101;
    });
    truffleAssert.eventEmitted(tx, 'Airdrop', (ev) => {
      return ev.initiator === user1
        && ev.receiver === SOME_ADDRESS[1]
        && parseInt(ev.tokenId) === 101;
    });
  });

  it('[You can\'t airdrop] Airdrop #102: first address <- not an airdropper', async () => {
    const tx = marsColony.airdrop(SOME_ADDRESS[0], 102, {
      from: user3,
    });
    await truffleAssert.reverts(tx, 'You can\'t airdrop');
  });

  it('Airdrop #21000: third address <- third airdropper', async () => {
    const tx = await marsColony.airdrop(SOME_ADDRESS[2], 21000, {
      from: user2,
    });
    const owner100 = await marsColony.ownerOf.call(21000);
    assert(owner100 === SOME_ADDRESS[2]);
    truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
      return ev.from === '0x0000000000000000000000000000000000000000'
        && ev.to === SOME_ADDRESS[2]
        && parseInt(ev.tokenId) === 21000;
    });
    truffleAssert.eventEmitted(tx, 'Airdrop', (ev) => {
      return ev.initiator === user2
        && ev.receiver === SOME_ADDRESS[2]
        && parseInt(ev.tokenId) === 21000;
    });
  });

  it('[No more airdrops left] Airdrop after max airdrop count', async () => {
    const tx = marsColony.airdrop(SOME_ADDRESS[0], 555, {
      from: user1,
    });
    await truffleAssert.reverts(tx, 'No more airdrops left');
  });
});
