const { assert } = require('chai');
const { time } = require('openzeppelin-test-helpers');

const GameManagerFixed = artifacts.require('GameManagerFixed');

contract('Attributes', (accounts) => {
  const [owner, user1] = accounts;

  let gm;
  let mc;

  before(async () => {
    gm = await GameManagerFixed.deployed();
  });

  it('Initial speed and earnings', async () => {
    await gm.airdrop(user1, 1, { from: owner });
    await gm.airdrop(user1, 2, { from: owner });
    await gm.airdrop(user1, 3, { from: owner });

    const {
      baseStation,
      transport,
      robotAssembly,
      powerProduction,
      earned,
      speed,
    } = ( await gm.getAttributesMany([1]) )[0];
    assert(parseInt(baseStation) === 0);
    assert(parseInt(transport) === 0);
    assert(parseInt(robotAssembly) === 0);
    assert(parseInt(powerProduction) === 0);
    assert(parseInt(speed) === 1);
    assert.isBelow(earned * 1e-18, 0.0001);
    const { '0': earnedFromData, '1': speedFromData } = await gm.getEarningData([1, 2, 3]);
    assert(speedFromData == 3);
    assert.isBelow(earnedFromData * 1e-18, 0.0002);
    await time.increase(60 * 60 * 24 * 10);

    const {
      'earned': earned2,
    } = ( await gm.getAttributesMany([1]) )[0];
    assert.isAtLeast(earned2 * 1e-18, 10);
    assert.isBelow(earned2 * 1e-18, 10.1);
    const { '0': earnedFromData2, '1': speedFromData2 } = await gm.getEarningData([1, 2, 3]);
    assert(speedFromData2 == 3);
    assert.isAbove(earnedFromData2 * 1e-18, 30);
    assert.isBelow(earnedFromData2 * 1e-18, 30.1);
    // TODO check fail if not minted yet
  });
  

});
