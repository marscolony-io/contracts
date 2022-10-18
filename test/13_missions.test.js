const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GameManagerFixed = artifacts.require("GameManagerFixed");
const CLNY = artifacts.require("CLNY");
const CollectionManager = artifacts.require("CollectionManager");
const NFT = artifacts.require("MartianColonists");
const MSN = artifacts.require("MissionManager");
const MC = artifacts.require("MC");
const Dependencies = artifacts.require("Dependencies");

contract("MissionsManager", (accounts) => {
  const [owner, user1, user2, user3] = accounts;

  let gm;
  let clny;
  let collection;
  let nft;
  let msn;
  let mc;
  let d;

  before(async () => {
    gm = await GameManagerFixed.deployed();
    clny = await CLNY.deployed();
    collection = await CollectionManager.deployed();
    nft = await NFT.deployed();
    msn = await MSN.deployed();
    mc = await MC.deployed();
    d = await Dependencies.deployed();
    await collection.setMaxTokenId(5);
    await gm.setPrice(web3.utils.toWei("0.1"), { from: owner });
    await gm.claim([100], { value: web3.utils.toWei("0.1"), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
    await gm.claim([300], { value: web3.utils.toWei("0.1"), from: user3 });
    await time.increase(60 * 60 * 24 * 365.25 * 1000); // wait 10 years
    await gm.claimEarned([100], { from: user1 }); // claim 3652.5 clny
    await gm.claimEarned([300], { from: user3 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user3 }); // avatar 4 to check rewards
  });

  describe("getLandsData()", function() {
    it("Returns empty array if no lands have been sent in function params", async () => {
      const missions = await msn.getLandsData([]);
      assert.isTrue(Array.isArray(missions));
      assert.equal(missions.length, 0);
    });

    it("Returns lands by lands ids", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      const availableLands = await msn.getLandsData(lands);
      expect(availableLands).to.have.lengthOf(2);
      // expect(availableLands[0].availableMissionCount === "1");
      // expect(availableLands[1].availableMissionCount === "1");
    });

    it("Returns lands with correct private flags", async () => {
      await msn.setAccountPrivacy(true, { from: user1 });
      const lands = await mc.allTokensPaginate(0, 1);
      const availableLands = await msn.getLandsData(lands);
      expect(availableLands[0].isPrivate).to.be.true;
      expect(availableLands[1].isPrivate).to.be.false;
    });

    it("Returns land with limit 0 and default revshare", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      const availableLands = await msn.getLandsData(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("0");
      expect(availableLands[0].revshare).to.be.equal("20");
    });

    it("Returns land with limit 1 for base station", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      await gm.buildBaseStation(100, { from: user1 });
      const availableLands = await msn.getLandsData(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("1");
    });

    it("Returns land with limit 2 for Power Plant 1 level", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      await gm.buildPowerProduction(100, 1, { from: user1 });

      const availableLands = await msn.getLandsData(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("2");
    });

    it("Returns land with limit 3 for Power Plant 2 level", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      await gm.buildPowerProduction(100, 2, { from: user1 });

      const availableLands = await msn.getLandsData(lands);
      expect(availableLands[0].availableMissionCount).to.be.equal("3");
    });

    it("Returns land with limit 4 for Power Plant 2 level", async () => {
      const lands = await mc.allTokensPaginate(0, 1);
      await gm.buildPowerProduction(100, 3, { from: user1 });

      const availableLands = await msn.getLandsData(lands);
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
      await d.setBackendSigner(signer.address);
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

    const avatarId = 4;
    const landId = 200;
    const avatarReward = 80;
    const landReward = 20;

    it("Xp added, CLNY rewards added for avatar and to land", async () => {
      const initialXp = await collection.getXP([1]);

      const avatarOwner = await nft.ownerOf(avatarId);
      const landOwner = await mc.ownerOf(landId);

      const initialAvatarOwnerClnyBalance = await clny.balanceOf(avatarOwner);

      const initialLandOwnerClnyBalance = await clny.balanceOf(landOwner);

      const landEarningBefore = await gm.landMissionEarnings(landId);

      const message = `11111111111111111111111111111111${avatarId
        .toString()
        .padStart(5, "0")
        .repeat(2)}${landId
        .toString()
        .padStart(5, "0")}1000000000${avatarReward
        .toString()
        .padStart(4, "0")}${landReward
        .toString()
        .padStart(4, "0")}11111111111111`;

      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      await gm.finishMission(message, signature.v, signature.r, signature.s, {
        from: owner,
      });

      const addedXp = await collection.getXP([4]);

      expect(+addedXp - +initialXp).to.be.equal(10000000);

      const finalAvatarOwnerClnyBalance = await clny.balanceOf(avatarOwner);

      const finalLandOwnerClnyBalance = await clny.balanceOf(landOwner);

      const avatarOwnerBalanceDiff = finalAvatarOwnerClnyBalance.sub(
        initialAvatarOwnerClnyBalance
      );

      const landOwnerBalanceDiff = finalLandOwnerClnyBalance.sub(
        initialLandOwnerClnyBalance
      );

      expect(parseInt(avatarOwnerBalanceDiff)).to.be.equal(
        (avatarReward * 10 ** 18) / 100
      );
      expect(parseInt(landOwnerBalanceDiff)).to.be.equal(0);

      const landEarningAfter = await gm.landMissionEarnings(landId);

      const landEarningDiff = landEarningAfter.sub(landEarningBefore);

      expect(parseInt(landEarningDiff)).to.be.equal(
        (landReward * 10 ** 18) / 100
      );
    });

    it("getEarned not changed after fixEarnings", async () => {
      const earnedBefore = await gm.getEarned(landId);
      await gm.fixEarnings([landId]);
      const earnedAfter = await gm.getEarned(landId);
      expect(earnedAfter / 1_000_000).to.be.approximately(
        earnedBefore / 1_000_000,
        50_000_000
      );
    });

    it("set landMissionEarnings to zero after claim", async () => {
      const landOwner = await mc.ownerOf(landId);
      await gm.claimEarned([landId], { from: landOwner });

      const landMissionEarnings = await gm.landMissionEarnings(landId);

      expect(parseInt(landMissionEarnings)).to.be.equal(0);
    });

    it("signature has been used", async () => {
      const message = `11111111111111111111111111111111${avatarId
        .toString()
        .padStart(5, "0")
        .repeat(2)}${landId
        .toString()
        .padStart(5, "0")}1000000000${avatarReward
        .toString()
        .padStart(4, "0")}${landReward
        .toString()
        .padStart(4, "0")}11111111111111`;

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
      const message = `11111111111111111111111111111111${avatarId
        .toString()
        .padStart(5, "0")
        .repeat(2)}${landId
        .toString()
        .padStart(5, "0")}1000000502${avatarReward
        .toString()
        .padStart(4, "0")}${landReward
        .toString()
        .padStart(4, "0")}11111111111111`;
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
          parseInt(ev.landId) === landId &&
          parseInt(ev.avatarId) === avatarId &&
          parseInt(ev.rewardType) === 0 &&
          parseInt(ev.rewardAmount) === 10000005
        );
      });

      truffleAssert.eventEmitted(mcTx, "MissionReward", (ev) => {
        return (
          parseInt(ev.landId) === landId &&
          parseInt(ev.avatarId) === avatarId &&
          parseInt(ev.rewardType) === 100002 &&
          parseInt(ev.rewardAmount) === 1
        );
      });

      truffleAssert.eventEmitted(mcTx, "MissionReward", (ev) => {
        return (
          parseInt(ev.landId) === landId &&
          parseInt(ev.avatarId) === avatarId &&
          parseInt(ev.rewardType) === 1 &&
          parseInt(ev.rewardAmount) === (avatarReward * 10 ** 18) / 100
        );
      });

      truffleAssert.eventEmitted(mcTx, "MissionReward", (ev) => {
        return (
          parseInt(ev.landId) === landId &&
          parseInt(ev.avatarId) === avatarId &&
          parseInt(ev.rewardType) === 2 &&
          parseInt(ev.rewardAmount) === (landReward * 10 ** 18) / 100
        );
      });
    });
  });
});
