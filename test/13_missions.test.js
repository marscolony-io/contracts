const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GM = artifacts.require("GameManager");
const CLNY = artifacts.require("CLNY");
const AvatarManager = artifacts.require("AvatarManager");
const NFT = artifacts.require("MartianColonists");
const MSN = artifacts.require("MissionManager");
const MC = artifacts.require("MC");

contract("MissionsManager", (accounts) => {
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
    await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
    await gm.claim([100], { value: web3.utils.toWei("0.1"), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
    await time.increase(60 * 60 * 24 * 365.25 * 1000); // wait 10 years
    await gm.claimEarned([100], { from: user1 }); // claim 3652.5 clny
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
  });

  describe("getAvailableMissions()", function() {
    it("Returns empty array if no lands have been sent in function params", async () => {
      const missions = await msn.getAvailableMissions([]);
      assert.isTrue(Array.isArray(missions));
      assert.equal(missions.length, 0);
    });

    it("Returns lands by lands ids", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands).to.have.lengthOf(2);
      // expect(availableLands[0].availableMissionCount === "1");
      // expect(availableLands[1].availableMissionCount === "1");
    });

    it("Returns lands with correct private flags", async () => {
      await msn.setAccountPrivacy(true, { from: user1 });
      const lands = await mc.allTokensPaginate(0, 1);
      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands[0].isPrivate).to.be.true;
      expect(availableLands[1].isPrivate).to.be.false;
    });

    it("Returns land with limit 0", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("0");
    });

    it("Returns land with limit 1 for base station", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      await gm.buildBaseStation(100, { from: user1 });
      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("1");
    });

    it("Returns land with limit 2 for Power Plant 1 level", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      await gm.buildPowerProduction(100, 1, { from: user1 });

      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("2");
    });

    it("Returns land with limit 3 for Power Plant 2 level", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      await gm.buildPowerProduction(100, 2, { from: user1 });

      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("3");
    });

    it("Returns land with limit 4 for Power Plant 2 level", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      await gm.buildPowerProduction(100, 3, { from: user1 });

      const availableLands = await msn.getAvailableMissions(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("4");
    });
  });

  describe("GM.finishMission()", function() {
    const signer = {
      privateKey:
        "4028ea385a848c51ff76c0d968305e273d415335ccd06854630a8465b67a9eef",
      address: "0x5a636D26070A8a132E4731743CA12964CBB1950b",
    };

    it("Reverts if signature is not from server", async () => {
      const message =
        "1111111111111111000012100015555555111111111111111111111111";
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      const tx = gm.finishMission(
        message,
        signature.v,
        signature.r,
        signature.s
      );
      await truffleAssert.reverts(tx, "Signature is not from server");
    });

    it("Set message sender to backend sender", async () => {
      await gm.setBackendSigner(signer.address);
    });

    it("Fails if avatarId is not doubled", async () => {
      const message =
        "1111111111111111111111111111111100001000022100015555555111111111111111111111111";
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      const tx = gm.finishMission(
        message,
        signature.v,
        signature.r,
        signature.s
      );

      await truffleAssert.reverts(tx, "check failed");
    });

    it("Fails if avatarId is not valid", async () => {
      const message =
        "1111111111111111111111111111111100000000002100015555555111111111111111111111111";
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      const tx = gm.finishMission(
        message,
        signature.v,
        signature.r,
        signature.s
      );

      await truffleAssert.reverts(tx, "AvatarId is not valid");
    });

    it("Fails if landId is not valid", async () => {
      const message =
        "1111111111111111111111111111111100001000012100115555555111111111111111111111111";
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      const tx = gm.finishMission(
        message,
        signature.v,
        signature.r,
        signature.s
      );

      await truffleAssert.reverts(tx, "LandId is not valid");
    });

    it("Fails if XP increment is not valid", async () => {
      const message =
        "1111111111111111111111111111111100001000012100055555555111111111111111111111111";
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      const tx = gm.finishMission(
        message,
        signature.v,
        signature.r,
        signature.s
      );

      await truffleAssert.reverts(tx, "XP increment is not valid");
    });

    it("Fails if Lootbox code is not valid", async () => {
      const message =
        "1111111111111111111111111111111100001000012100015555555111111111111111111111111";
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      const tx = gm.finishMission(
        message,
        signature.v,
        signature.r,
        signature.s
      );

      await truffleAssert.reverts(tx, "Lootbox code is not valid");
    });

    it("Xp added", async () => {
      const initialXp = await avatars.getXP([1]);
      const message =
        "1111111111111111111111111111111100002000022100010000000001111111111111111111111";
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      await gm.finishMission(message, signature.v, signature.r, signature.s);

      const addedXp = await avatars.getXP([2]);

      expect(+addedXp - +initialXp).to.be.equal(10000000);
    });

    it("signature has been used", async () => {
      const message =
        "1111111111111111111111111111111100002000022100010000000001111111111111111111111";
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      const tx = gm.finishMission(
        message,
        signature.v,
        signature.r,
        signature.s
      );

      await truffleAssert.reverts(tx, "signature has been used");
    });

    it("MissionReward event emitted", async () => {
      const message =
        "1111111111111111111111111111111100002000022000010000005001111111111111111111111";
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      const tx = await gm.finishMission(
        message,
        signature.v,
        signature.r,
        signature.s
      );

      const mcTx = await truffleAssert.createTransactionResult(gm, tx.tx);

      truffleAssert.eventEmitted(mcTx, "MissionReward", (ev) => {
        return (
          parseInt(ev.landId) === 20000 &&
          parseInt(ev.avatarId) === 2 &&
          parseInt(ev.rewardType) === 0 &&
          parseInt(ev.rewardAmount) === 10000005
        );
      });
    });
  });
});
