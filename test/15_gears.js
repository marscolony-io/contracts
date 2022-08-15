const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GameManagerFixed = artifacts.require("GameManagerFixed");
const GEARS = artifacts.require("Gears");
const LOOTBOXES = artifacts.require("Lootboxes");
const AVATARS = artifacts.require("MartianColonists");
const AM = artifacts.require("AvatarManager");
const MC = artifacts.require("MC");
const CLNY = artifacts.require("CLNY");

contract("Gears", (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let gears;
  let lootboxes;
  let avatars;
  let am;
  let mc;
  let clny;

  const baseUri = "baseuri.test/";

  before(async () => {
    gm = await GameManagerFixed.deployed();
    gears = await GEARS.deployed();
    lootboxes = await LOOTBOXES.deployed();
    avatars = await AVATARS.deployed();
    am = await AM.deployed();
    mc = await MC.deployed();
    clny = await CLNY.deployed();

    await am.setMaxTokenId(5);
    await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
    await gm.claim([1], { value: web3.utils.toWei("0.1"), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
    await time.increase(60 * 60 * 24 * 365 * 10);
    await gm.claimEarned([1], { from: user1 });
    await gm.claimEarned([200], { from: user2 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
  });

  describe("Mint", function() {
    // describe("Initial gear arrays set", function() {
    //   it("initial common gears length", async () => {
    //     const initialCommonGears = await gears.getInitialLength();
    //     console.log("initialCommonGears", initialCommonGears.toString());
    //   });
    // });

    it("Reverts if mint called not by mission manager", async () => {
      const tx = gears.mint(user2, 1);
      await truffleAssert.reverts(tx, "only game manager");
    });

    it("Mints if called by mission manager", async () => {
      await gears.setGameManager(DAO);
      await gears.setBaseURI(baseUri);
      await gears.mint(user1, 0);
      await gears.mint(user2, 1);
      const supplyAfterMint = await gears.totalSupply();
      expect(Number(supplyAfterMint.toString())).to.be.equal(2);
      const ownerOf1 = await gears.ownerOf(1);
      const ownerOf2 = await gears.ownerOf(2);
      expect(ownerOf1).to.be.equal(user1);
      expect(ownerOf2).to.be.equal(user2);
    });
  });

  describe("initialGears", function() {
    it("Returns initialCommonGears", async () => {
      const initialCommonGears = await gears.initialCommonGears(0);
      // console.log(
      //   "initialCommonGears 0 rarity",
      //   initialCommonGears.rarity.toString()
      // );
      expect(initialCommonGears.rarity).to.be.bignumber.equal(new BN(0));
    });

    it("Returns initialRareGears", async () => {
      const initialRareGears = await gears.initialRareGears(0);
      // console.log(
      //   "initialRareGears 0 rarity",
      //   initialRareGears.rarity.toString()
      // );
      expect(initialRareGears.rarity).to.be.bignumber.equal(new BN(1));
    });

    it("Returns initialLegendaryGears", async () => {
      const initialLegendaryGears = await gears.initialLegendaryGears(0);
      // console.log(
      //   "initialLegendaryGears 0 rarity",
      //   initialLegendaryGears.rarity.toString()
      // );
      expect(initialLegendaryGears.rarity).to.be.bignumber.equal(new BN(2));
    });

    it("Returns transportGears", async () => {
      const transportGears = await gears.transportGears(0);
      // console.log("transportGears 0 rarity", transportGears.rarity.toString());
      expect(transportGears.rarity).to.be.bignumber.equal(new BN(2));
    });
  });

  describe("Randomized mint", function() {
    it("getRandomizedGearFromCommonLootbox", async () => {
      const raritiesMap = new Map();
      raritiesMap.set("common", 0);
      raritiesMap.set("rare", 0);

      for (let i = 0; i < 1000; i++) {
        await time.increase(1);
        // const rnd10 = await gears.randomNumber(10);
        // console.log("rnd10", rnd10.toString());

        // const rnd2 = await gears.randomNumber(2);
        // console.log("rnd2", rnd2.toString());

        // const rnd4 = await gears.randomNumber(4);
        // console.log("rnd4", rnd4.toString());

        // const getRandomizedGearRarity = await gears.getRandomizedGearRarity(0);
        // console.log(
        //   "getRandomizedGearRarity",
        //   parseInt(getRandomizedGearRarity)
        // );

        // const getRandomizedGear = await gears.getRandomizedGear(
        //   0,
        //   parseInt(getRandomizedGearRarity)
        // );
        // console.log("getRandomizedGear", {
        //   getRandomizedGear: {
        //     rarity: parseInt(getRandomizedGear.rarity),
        //     gearType: parseInt(getRandomizedGear.gearType),
        //     durability: parseInt(getRandomizedGear.durability),
        //   },
        // });

        const calculateGearFromCommonLootbox = await gears.calculateGear(0);
        // console.log("calculateGearFromCommonLootbox", {
        //   calculateGearFromCommonLootbox: {
        //     rarity: calculateGearFromCommonLootbox.rarity.toString(),
        //     gearType: calculateGearFromCommonLootbox.gearType.toString(),
        //     durability: calculateGearFromCommonLootbox.durability.toString(),
        //   },
        // });

        const rarity = parseInt(calculateGearFromCommonLootbox.rarity);

        expect([0, 1].includes(rarity));

        if (rarity === 0) {
          raritiesMap.set("common", raritiesMap.get("common") + 1);
        } else if (rarity === 1) {
          raritiesMap.set("rare", raritiesMap.get("rare") + 1);
        }
      }

      console.log("common lootbox random gears", {
        common: raritiesMap.get("common"),
        rare: raritiesMap.get("rare"),
      });

      const rarePercentile =
        raritiesMap.get("rare") /
        (raritiesMap.get("common") + raritiesMap.get("rare"));

      console.log({ rarePercentile });

      expect(rarePercentile).to.be.lessThan(0.15); // approx 10% of gears are rare
    });

    it("getRandomizedGearFromRareLootbox", async () => {
      const raritiesMap = new Map();
      raritiesMap.set("common", 0);
      raritiesMap.set("rare", 0);
      raritiesMap.set("legendary", 0);

      for (let i = 0; i < 1000; i++) {
        await time.increase(1);

        // const rnd10 = await gears.randomNumber(10);
        // console.log("rnd10", rnd10.toString());

        // const rnd2 = await gears.randomNumber(2);
        // console.log("rnd2", rnd2.toString());

        const calculateGearFromRareLootbox = await gears.calculateGear(1);
        // console.log({
        //   calculateGearFromRareLootbox: {
        //     rarity: calculateGearFromRareLootbox.rarity.toString(),
        //     gearType: calculateGearFromRareLootbox.gearType.toString(),
        //     durability: calculateGearFromRareLootbox.durability.toString(),
        //   },
        // });

        const rarity = parseInt(calculateGearFromRareLootbox.rarity);
        const gearType = parseInt(calculateGearFromRareLootbox.gearType);

        expect([0, 1, 2].includes(rarity));

        // no transport gear for rare lootbox
        if (rarity === 3) {
          expect(![12, 13].includes(gearType));
        }

        if (rarity === 0) {
          raritiesMap.set("common", raritiesMap.get("common") + 1);
        } else if (rarity === 1) {
          raritiesMap.set("rare", raritiesMap.get("rare") + 1);
        } else if (rarity === 2) {
          raritiesMap.set("legendary", raritiesMap.get("legendary") + 1);
        }
      }

      console.log("rare lootbox random gears", {
        common: raritiesMap.get("common"),
        rare: raritiesMap.get("rare"),
        legendary: raritiesMap.get("legendary"),
      });

      const commonPercentile =
        raritiesMap.get("common") /
        (raritiesMap.get("common") +
          raritiesMap.get("rare") +
          raritiesMap.get("legendary"));

      console.log({ commonPercentile });

      expect(commonPercentile).to.be.lessThan(0.2); // approx 15% of gears are rare

      const legendaryPercentile =
        raritiesMap.get("legendary") /
        (raritiesMap.get("common") +
          raritiesMap.get("rare") +
          raritiesMap.get("legendary"));

      console.log({ legendaryPercentile });

      expect(legendaryPercentile).to.be.lessThan(0.2); // approx 15% of gears are legendary
    });

    it("getRandomizedGearFromLegendaryLootbox", async () => {
      const raritiesMap = new Map();
      raritiesMap.set("legendary", 0);
      raritiesMap.set("rare", 0);
      raritiesMap.set("transports", 0);

      for (let i = 0; i < 1000; i++) {
        await time.increase(1);
        // const rnd10 = await gears.randomNumber(10);
        // console.log("rnd10", rnd10.toString());

        // const rnd2 = await gears.randomNumber(2);
        // console.log("rnd2", rnd2.toString());

        // const rnd4 = await gears.randomNumber(4);
        // console.log("rnd4", rnd4.toString());

        // const getRandomizedGearRarity = await gears.getRandomizedGearRarity(0);
        // console.log(
        //   "getRandomizedGearRarity",
        //   parseInt(getRandomizedGearRarity)
        // );

        // const getRandomizedGear = await gears.getRandomizedGear(
        //   0,
        //   parseInt(getRandomizedGearRarity)
        // );
        // console.log("getRandomizedGear", {
        //   getRandomizedGear: {
        //     rarity: parseInt(getRandomizedGear.rarity),
        //     gearType: parseInt(getRandomizedGear.gearType),
        //     durability: parseInt(getRandomizedGear.durability),
        //   },
        // });

        const calculateGearFromCommonLootbox = await gears.calculateGear(2);
        // console.log("calculateGearFromCommonLootbox", {
        //   calculateGearFromCommonLootbox: {
        //     rarity: calculateGearFromCommonLootbox.rarity.toString(),
        //     gearType: calculateGearFromCommonLootbox.gearType.toString(),
        //     durability: calculateGearFromCommonLootbox.durability.toString(),
        //   },
        // });

        const rarity = parseInt(calculateGearFromCommonLootbox.rarity);
        const gearType = parseInt(calculateGearFromCommonLootbox.gearType);

        expect([1, 2].includes(rarity));

        if (rarity === 1) {
          raritiesMap.set("rare", raritiesMap.get("rare") + 1);
        } else if (rarity === 2) {
          raritiesMap.set("legendary", raritiesMap.get("legendary") + 1);
          if ([12, 13].includes(gearType)) {
            raritiesMap.set("transports", raritiesMap.get("transports") + 1);
          }
        }
      }

      console.log("legendary lootbox random gears", {
        legendary: raritiesMap.get("legendary"),
        rare: raritiesMap.get("rare"),
        transports: raritiesMap.get("transports"),
      });

      const rarePercentile =
        raritiesMap.get("rare") /
        (raritiesMap.get("legendary") + raritiesMap.get("rare"));

      // console.log({ rarePercentile });

      expect(rarePercentile).to.be.lessThan(0.15); // approx 10% of gears are rare
    });
  });

  describe("TokenURI", function() {
    it("Returns correct URI with gearType part", async () => {
      const uri = await gears.tokenURI(1);

      const gear = await gears.gears(1);

      const [base1, id1, gearType] = uri.split("/");
      expect(baseUri.startsWith(base1)).to.be.true;
      expect(id1).to.be.equal("1");
      expect(gearType).to.be.equal(gear.gearType.toString());
    });
  });

  describe("lockGear", function() {
    it("Reverts if lock called not by owner", async () => {
      const tx = gears.lockGear(1);
      await truffleAssert.reverts(tx, "only token owner");
    });

    it("lockGear by owner", async () => {
      await gears.lockGear(1, { from: user1 });
      const gear = await gears.gears(1);

      const locked = await gear.locked;
      expect(locked).to.be.equal(true);
    });

    it("Reverts if unlock called not by owner", async () => {
      const tx = gears.unlockGear(1);
      await truffleAssert.reverts(tx, "only token owner");
    });

    it("unlockGear by owner", async () => {
      await gears.unlockGear(1, { from: user1 });

      const gear = await gears.gears(1);
      const locked = await gear.locked;
      expect(locked).to.be.equal(false);
    });
  });

  describe("All My Tokens Paginate", async () => {
    it("Checks the function", async () => {
      const hundredTokens = await gears.allMyTokensPaginate(0, 99, {
        from: user1,
      });

      console.log(
        "token0",
        hundredTokens[0].map((value) => +value)
      );

      expect(Array.isArray(hundredTokens[0])).to.be.equal(true);
      // expect(Array.isArray(hundredTokens[99])).to.be.equal(true);
      expect(typeof hundredTokens[100]).to.be.equal("undefined");

      // expect(twoFirstTokens[0].map((value) => +value)).to.be.eql([1, 3]);
      // expect(twoFirstTokens[1].map((value) => +value)).to.be.eql([0, 2]);
    });
  });

  describe("Transfer lock", async () => {
    it("Can not be transferred while locked", async () => {
      await gears.lockGear(1, { from: user1 });
      await expectRevert(
        gears.safeTransferFrom(user1, user2, 1, { from: user1 }),
        "This gear is locked by owner and can not be transferred"
      );
    });
    it("Can be transferred while unlocked", async () => {
      await gears.unlockGear(1, { from: user1 });
      await gears.safeTransferFrom(user1, user2, 1, { from: user1 });
      const newOwner = await gears.ownerOf(1);
      expect(newOwner.toString()).to.be.equal(user2);
    });
  });

  describe("GameManager burns a token", async () => {
    it("Not a GameManager can't burn token", async () => {
      await expectRevert(gears.burn(1, { from: user1 }), "only game manager");
    });
    it("GameManager can burn even locked token", async () => {
      await gears.lockGear(1, { from: user2 });
      await gears.burn(1, { from: DAO });
      await expectRevert(
        gears.ownerOf(1),
        "ERC721: owner query for nonexistent token"
      );
    });
  });

  describe("airdrop", () => {
    it("dao can make airdrop", async () => {
      const lastTokenId = await gears.nextIdToMint();
      await gears.airdrop(user1, 0, 15, 100);
      const gear = await gears.gears(lastTokenId);
      expect(gear.rarity.toString()).to.be.equal("0");
      expect(gear.gearType.toString()).to.be.equal("15");
      expect(gear.durability.toString()).to.be.equal("100");
    });
  });

  describe("gamemanager open lootbox", () => {
    it("can not be opened by not owner", async () => {
      await lootboxes.setGameManager(DAO);

      await lootboxes.mint(user1, 1, { from: DAO });
      await lootboxes.mint(user1, 1, { from: DAO });
      await expectRevert(
        gm.openLootbox(1, { from: DAO }),
        "You aren't the token owner"
      );
    });

    it("can be opened by owner", async () => {
      await lootboxes.setGameManager(gm.address);
      await gears.setGameManager(gm.address);
      const totalMintedGears = await gears.totalSupply();
      console.log("total minted gears", totalMintedGears.toString());
      const lastTokenId = await gears.nextIdToMint();
      console.log("lastTokenId", lastTokenId);
      await gm.openLootbox(1, { from: user1 });
      const mintedGearsAfter = await gears.totalSupply();
      console.log("minted gears after", mintedGearsAfter.toString());
      expect(parseInt(mintedGearsAfter)).to.be.equal(
        parseInt(totalMintedGears) + 1
      );

      const gear = await gears.gears(lastTokenId);
      console.log("gear", gear);

      const owner = await gears.ownerOf(lastTokenId);
      console.log("owner", owner);

      expect(owner).to.be.equal(user1);
    });

    it("can not open opened lootbox", async () => {
      await expectRevert(
        gm.openLootbox(1, { from: user1 }),
        "ERC721: owner query for nonexistent token"
      );
    });

    it("can not open if not enough clny", async () => {
      const clnyBalance = await clny.balanceOf(user1);
      console.log("clny balance", clnyBalance.toString());
      await clny.transfer(user2, clnyBalance.toString());
      await expectRevert(
        gm.openLootbox(2, { from: user1 }),
        "ERC20: transfer amount exceeds balance"
      );
    });
  });
});
