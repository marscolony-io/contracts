const { assert } = require("chai");
const truffleAssertions = require("truffle-assertions");
const truffleAssert = require('truffle-assertions');

const MarsColony = artifacts.require('MarsColony');

contract('MarsColony user data', (accounts) => {
  const [owner, user1, user2] = accounts;
  let dispatcher = 0;

  let marsColony;
  const TOKEN = 100;
  const TOKEN2 = 101;

  before(async () => {
    marsColony = await MarsColony.new(owner, 10, [owner, owner, owner], { from: owner });
    await marsColony.claimOne(TOKEN, {
      value: 0.677 * 10 ** 18,
      from: user1,
    });
  });

  it('Should store user data and read it', async () => {
    const data = 'testdatarewsdfgsdv';
    const tx = await marsColony.storeUserValue(TOKEN, data, {
      from: user1,
    });
    truffleAssert.eventEmitted(tx, 'UserData', { from: user1, data });
    const userValue = await marsColony.getUserValue.call(TOKEN);
    assert(userValue === data);
  });

  it('Should claim Land Plot #101 as user2', async () => {
    await marsColony.claimOne(TOKEN2, {
      value: 0.677 * 10 ** 18,
      from: user2,
    });
    const owner101 = await marsColony.ownerOf.call(TOKEN2);
    assert(owner101 === user2);
  });

  it('Set game dispatcher', async () => {
    const tx = await marsColony.setGameDispatcher(owner);
    dispatcher = owner;
    truffleAssertions.eventEmitted(tx, 'ChangeDispatcher', { dispatcher })
    const dispatcherValue = await marsColony.GameDispatcher.call();
    assert(dispatcherValue, dispatcher);
  });

  it('Should store game data and read it', async () => {
    const data = 'testdata89woyefhseik';
    const tx = await marsColony.storeGameValue(TOKEN, data, {
      from: dispatcher,
    });
    truffleAssert.eventEmitted(tx, 'GameData', { dispatcher, data });
    const gameValue = await marsColony.getGameValue.call(TOKEN);
    assert(gameValue === data);
  });

  let currentGameState = 0;

  it('Should toggle game state and read it', async () => {
    const toggle = 1;
    const startState = currentGameState;
    const result = startState ^ toggle;
    const tx = await marsColony.toggleGameState(TOKEN, toggle, {
      from: dispatcher,
    });
    truffleAssert.eventEmitted(tx, 'GameState', (ev) => {
      return ev.dispatcher === dispatcher && ev.result.toString() === result.toString();
    });
    const gameState = parseInt(await marsColony.getGameState.call(TOKEN));
    assert(gameState === result);
    currentGameState = gameState;
  });

  it('Should toggle game state and read it 2', async () => {
    const toggle = 17;
    const startState = currentGameState;
    const result = startState ^ toggle;
    const tx = await marsColony.toggleGameState(TOKEN, toggle, {
      from: dispatcher,
    });
    truffleAssert.eventEmitted(tx, 'GameState', (ev) => {
      return ev.dispatcher === dispatcher && ev.result.toString() === result.toString();
    });
    const gameState = parseInt(await marsColony.getGameState.call(TOKEN));
    assert(gameState === result);
  });
});
