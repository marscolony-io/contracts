const { expect } = require('chai');
const { time, expectRevert } = require('openzeppelin-test-helpers');

const GameManagerFixed = artifacts.require('GameManagerFixed');
const CLNY = artifacts.require('CLNY');

contract('Build and set position test', (accounts) => {
  const [owner, , , user1, user2] = accounts;

  let gm;
  let clny;

  before(async () => {
    gm = await GameManagerFixed.deployed();
    clny = await CLNY.deployed();
  });

  it('Airdrop plots for testing', async () => {
    await gm.airdrop(user1, 1, { from: owner });
    await gm.airdrop(user1, 2, { from: owner });
    await time.increase(60 * 60 * 24 * 365.25 * 1000); // wait 10 years
    await gm.claimEarned([1], { from: user1 }); // claim 3652.5 clny
  });

  it('Build enhancements', async () => {
    await gm.buildBaseStation(1, { from: user1 });
    await gm.buildTransport(1, 1, { from: user1 });
    await gm.buildRobotAssembly(1, 1, { from: user1 });
    await gm.buildPowerProduction(1, 1, { from: user1 });
  });

  it('Placements should be 0, 0', async () => {
    for (const method of [
      'baseStationsPlacement',
      'transportPlacement',
      'robotAssemblyPlacement',
      'powerProductionPlacement',
    ]) {
      const { x, y, rotate } = await gm[method](1, { from: user1 });
      expect(parseInt(x)).to.be.equal(0);
      expect(parseInt(y)).to.be.equal(0);
      expect(parseInt(rotate)).to.be.equal(0);
    }
  });

  it('Place enhancements', async () => {
    for (const [enhancement, placingMethod, placementGetter] of [
      ['base station', 'placeBaseStation', 'baseStationsPlacement'],
      ['transport', 'placeTransport', 'transportPlacement'],
      ['robot assembly', 'placeRobotAssembly', 'robotAssemblyPlacement'],
      ['power production', 'placePowerProduction', 'powerProductionPlacement'],
    ]) {
      await expectRevert(
        gm[placingMethod](1, 5, 7, true, { from: user2 }),
        'You aren\'t the token owner',
      );
      await expectRevert(
        gm[placingMethod](2, 5, 7, true, { from: user1 }),
        `There should be a ${enhancement}`,
      );
      const clnyBalance = await clny.balanceOf(user1);
      expect(parseInt(clnyBalance)).to.be.above(0);
      await gm[placingMethod](1, 5, 7, true, { from: user1 });
      const clnyBalance2 = await clny.balanceOf(user1);
      // shouldn't deduct any clny for placing of unplaced
      expect(parseInt(clnyBalance2)).to.be.equal(parseInt(clnyBalance));
      // expecting free but we can't do it free
      await expectRevert(
        gm[placingMethod](1, 50, 70, true, { from: user1 }),
        'You can place only for CLNY now',
      );
      await gm[placingMethod](1, 50, 70, false, { from: user1 });
      const clnyBalance3 = await clny.balanceOf(user1);
      // should deduct 5 clny for next placing
      // !!! frontend should notify user about this
      expect(clnyBalance2 - clnyBalance3).to.be.approximately(5e18, 5e10);
      const { x, y } = await gm[placementGetter](1, { from: user1 });
      expect(parseInt(x)).to.be.equal(50);
      expect(parseInt(y)).to.be.equal(70);
    }
  });

  it('Place enhancements while building', async () => {
    for (const [enhancement, placingMethod, placementGetter, cost, error] of [
      ['base station', 'buildAndPlaceBaseStation', 'baseStationsPlacement', 30e18, 'There is already a base station'],
      ['transport', 'buildAndPlaceTransport', 'transportPlacement', 120e18, 'Can buy only next level'],
      ['robot assembly', 'buildAndPlaceRobotAssembly', 'robotAssemblyPlacement', 120e18, 'Can buy only next level'],
      ['power production', 'buildAndPlacePowerProduction', 'powerProductionPlacement', 120e18, 'Can buy only next level'],
    ]) {
      await expectRevert(
        gm[placingMethod](2, 5, 7, { from: user2 }),
        'You aren\'t the token owner',
      );
      await expectRevert(
        gm[placingMethod](1, 5, 7, { from: user1 }),
        error,
      );
      const clnyBalance = await clny.balanceOf(user1);
      expect(parseInt(clnyBalance)).to.be.above(0);
      await gm[placingMethod](2, 5, 7, { from: user1 });
      const clnyBalance2 = await clny.balanceOf(user1);
      // should deduct cost of enhancement
      expect(clnyBalance - clnyBalance2).to.be.approximately(cost, 5e10);
      const { x, y } = await gm[placementGetter](2, { from: user1 });
      expect(parseInt(x)).to.be.equal(5);
      expect(parseInt(y)).to.be.equal(7);
    }
  });

  it('Upgrading enhancements', async () => {
    await gm.buildTransport(1, 2, { from: user1 });
    await gm.buildRobotAssembly(1, 2, { from: user1 });
    await gm.buildPowerProduction(1, 2, { from: user1 });
    await gm.buildTransport(1, 3, { from: user1 });
    await gm.buildRobotAssembly(1, 3, { from: user1 });
    await gm.buildPowerProduction(1, 3, { from: user1 });
  });

  it('Get enhancements (deprecated)', async () => {
    const enh = (await gm.getAttributesMany([1], { from: user1 }))[0];
    expect(parseInt(enh['baseStation'])).to.be.equal(1);
    expect(parseInt(enh['transport'])).to.be.equal(3);
    expect(parseInt(enh['robotAssembly'])).to.be.equal(3);
    expect(parseInt(enh['powerProduction'])).to.be.equal(3);
  });
});
