const { assert, expect } = require('chai');
const truffleAssert = require('truffle-assertions');
const { time, BN, expectRevert } = require('openzeppelin-test-helpers');

const GM = artifacts.require('GameManager');
const CLNY = artifacts.require('CLNY');
const AvatarManager = artifacts.require('AvatarManager');
const NFT = artifacts.require('MartianColonists');
const MSN = artifacts.require('MissionManager');
const MC = artifacts.require('MC');


contract('MissionsManager', (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let clny;
  let avatars;
  let nft;
  let msn;



  before(async () => {
    gm = await GM.deployed();
    clny = await CLNY.deployed();
    avatars = await AvatarManager.deployed();
    nft = await NFT.deployed();
    msn = await MSN.deployed();
    mc = await MC.deployed();
    await gm.setPrice(web3.utils.toWei('0.1'), { from: DAO });
    await gm.claim([100], { value: web3.utils.toWei('0.1'), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei('0.1'), from: user2 });
  });

  describe('getAvailableMissions()', function () {
    it('Returns empty array if no lands have been sent in function params', async () => {
      const missions = await msn.getAvailableMissions([]);
      assert.isTrue(Array.isArray(missions));
      assert.equal(missions.length, 0);
    });

    it('Returns lands by lands ids', async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands).to.have.lengthOf(2);
      expect(availableLands[0].availableMissionCount === '1');
      expect(availableLands[1].availableMissionCount === '1');

    });

    it('Returns changed missions count when user set acount private', async () => {
      await msn.setAccountPrivacy(true, { from: user1 });
      const lands = await mc.allTokensPaginate(0, 1);
      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands).to.have.lengthOf(2);
      expect(availableLands[0].availableMissionCount === '0');
      expect(availableLands[1].availableMissionCount === '1');
    });

  });

});
