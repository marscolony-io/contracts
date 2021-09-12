const { assert } = require("chai");

const MarsColony = artifacts.require('MarsColony');

contract('MarsColony', (accounts) => {
  const [owner, user1, user2] = accounts;
  let dispatcher = 0;
  const txParams = { from: owner };

  let marsColony;

  before(async () => {
    marsColony = await MarsColony.new(owner, txParams);
  });

  it('Should claim Land Plot #100 as user1', async () => {
    await marsColony.claim(100, {
      value: 0.0677 * 10 ** 18,
      from: user1,
    });
    const owner100 = await marsColony.ownerOf.call(100);
    assert(owner100 === user1);
  });

  it('Should store user data and read it', async () => {
    await marsColony.storeUserValue(100, 'test', {
      from: user1,
    });
    const userValue = await marsColony.getUserValue.call(100);
    assert(userValue === 'test');
  });

  it('Should claim Land Plot #101 as user2', async () => {
    await marsColony.claim(101, {
      value: 0.0677 * 10 ** 18,
      from: user2,
    });
    const owner101 = await marsColony.ownerOf.call(101);
    assert(owner101 === user2);
  });

  it('Set game dispatcher', async () => {
    await marsColony.setGameDispatcher(owner);
    dispatcher = owner;
    const dispatcherValue = await marsColony.GameDispatcher.call();
    assert(dispatcherValue, dispatcher);
  });

  it('Should store game data and read it', async () => {
    await marsColony.storeGameValue(100, 'test game val', {
      from: dispatcher,
    });
    const gameValue = await marsColony.getGameValue.call(100);
    assert(gameValue === 'test game val');
  });


});
