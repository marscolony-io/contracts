const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GameManagerFixed = artifacts.require("GameManagerFixed");
const Dependencies = artifacts.require("Dependencies");
const GEARS = artifacts.require("Gears");
const LOOTBOXES = artifacts.require("Lootboxes");
const AVATARS = artifacts.require("MartianColonists");
const CM = artifacts.require("CollectionManager");
const MC = artifacts.require("MC");
const CLNY = artifacts.require("CLNY");
const ORACLE = artifacts.require("Oracle");
const WETH = artifacts.require("Oracle");

contract("Gears", (accounts) => {
  const [owner, user1, user2, , , , , liquidity] = accounts;

  let gm;
  let gears;
  let lootboxes;
  let avatars;
  let cm;
  let mc;
  let clny;
  let oracle;
  let wethAddress;
  let d;

  const baseUri = "baseuri.test/";

  before(async () => {
    gm = await GameManagerFixed.deployed();
    gears = await GEARS.deployed();
    lootboxes = await LOOTBOXES.deployed();
    avatars = await AVATARS.deployed();
    cm = await CM.deployed();
    mc = await MC.deployed();
    clny = await CLNY.deployed();
    oracle = await ORACLE.deployed();
    wethAddress = (await WETH.deployed()).address;
    clny = await CLNY.deployed();
    d = await Dependencies.deployed();

    await cm.setMaxTokenId(5);
    await gm.setPrice(web3.utils.toWei("0.1"), { from: owner });
    await gm.claim([1], { value: web3.utils.toWei("0.1"), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
    await time.increase(60 * 60 * 24 * 365 * 10);
    await gm.claimEarned([1], { from: user1 });
    await gm.claimEarned([200], { from: user2 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
    await d.setOracle(oracle.address);

    await oracle.addRelayer(owner, { from: owner });

    await d.setGameManager(owner, { from: owner });
    await clny.mint(
      liquidity,
      new BN("2000000000000000000000"), // same as mocked weth, so rate should be 1/1
      1,
      {
        from: owner,
      }
    );

    // set weth price to $1,
    await oracle.actualize("1000000000000000000", { from: owner });
  });

  describe("Mint", function() {
    // describe("Initial gear arrays set", function() {
    //   it("initial common gears length", async () => {
    //     const initialCommonGears = await gears.getInitialLength();
    //     console.log("initialCommonGears", initialCommonGears.toString());
    //   });
    // });

    it("Reverts if mint called not by collection manager", async () => {
      const tx = gears.mint(user2, 1, 1, 1, 1);
      await truffleAssert.reverts(tx, "only collection manager");
    });

    it("Mints if called by collection manager", async () => {
      await d.setCollectionManager(owner);
      await gears.setBaseURI(baseUri);
      await gears.mint(user1, 1, 1, 1, 1);
      await gears.mint(user2, 1, 1, 1, 1);
      const supplyAfterMint = await gears.totalSupply();
      expect(Number(supplyAfterMint.toString())).to.be.equal(2);
      const ownerOf1 = await gears.ownerOf(1);
      const ownerOf2 = await gears.ownerOf(2);
      expect(ownerOf1).to.be.equal(user1);
      expect(ownerOf2).to.be.equal(user2);
    });
  });

  // describe("initialGears", function() {
  //   it("Returns initialCommonGears", async () => {
  //     const initialCommonGears = await gears.initialCommonGears(0);
  //     // console.log(
  //     //   "initialCommonGears 0 rarity",
  //     //   initialCommonGears.rarity.toString()
  //     // );
  //     expect(initialCommonGears.rarity).to.be.bignumber.equal(new BN(0));
  //   });

  //   it("Returns initialRareGears", async () => {
  //     const initialRareGears = await gears.initialRareGears(0);
  //     // console.log(
  //     //   "initialRareGears 0 rarity",
  //     //   initialRareGears.rarity.toString()
  //     // );
  //     expect(initialRareGears.rarity).to.be.bignumber.equal(new BN(1));
  //   });

  //   it("Returns initialLegendaryGears", async () => {
  //     const initialLegendaryGears = await gears.initialLegendaryGears(0);
  //     // console.log(
  //     //   "initialLegendaryGears 0 rarity",
  //     //   initialLegendaryGears.rarity.toString()
  //     // );
  //     expect(initialLegendaryGears.rarity).to.be.bignumber.equal(new BN(2));
  //   });

  //   it("Returns transportGears", async () => {
  //     const transportGears = await gears.transportGears(0);
  //     // console.log("transportGears 0 rarity", transportGears.rarity.toString());
  //     expect(transportGears.rarity).to.be.bignumber.equal(new BN(2));
  //   });
  // });

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

        const calculateGearFromCommonLootbox = await cm.calculateGear(0);
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

        const calculateGearFromRareLootbox = await cm.calculateGear(1);
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

        const calculateGearFromCommonLootbox = await cm.calculateGear(2);
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

      const [base1, id1, gearType, category, rarity] = uri.split("/");
      expect(baseUri.startsWith(base1)).to.be.true;
      expect(id1).to.be.equal("1");
    });
  });

  describe("lockGear", function() {
    it("Reverts if lock called not by collection manager", async () => {
      const tx = gears.lockGear(1, { from: user1 });
      await truffleAssert.reverts(tx, "only collection manager");
    });

    it("lockGear by collection manager", async () => {
      await gears.lockGear(1);
      const gear = await gears.gears(1);

      const locked = await gear.locked;
      expect(locked).to.be.equal(true);
    });

    it("Reverts if unlock called not by collection manager", async () => {
      const tx = gears.unlockGear(1, { from: user1 });
      await truffleAssert.reverts(tx, "only collection manager");
    });

    it("unlockGear by collection manager", async () => {
      await gears.unlockGear(1);

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
    it("Can not be transferred   while locked", async () => {
      await gears.lockGear(1);
      await expectRevert(
        gears.safeTransferFrom(user1, user2, 1, { from: user1 }),
        "This gear is locked by owner and can not be transferred"
      );
    });
    it("Can be transferred while unlocked", async () => {
      await gears.unlockGear(1);
      await gears.safeTransferFrom(user1, user2, 1, { from: user1 });
      const newOwner = await gears.ownerOf(1);
      expect(newOwner.toString()).to.be.equal(user2);
    });
  });

  describe("CollectionManager burns a token", async () => {
    it("Not a CollectionManager can't burn token", async () => {
      await expectRevert(
        gears.burn(1, { from: user1 }),
        "only collection manager"
      );
    });

    it("CollectionManager can burn even locked token", async () => {
      await gears.lockGear(1);
      await gears.burn(1, { from: owner });
      await expectRevert(
        gears.ownerOf(1),
        "ERC721: owner query for nonexistent token"
      );
    });
  });

  // describe("airdrop", () => {
  //   it("owner can make airdrop", async () => {
  //     const lastTokenId = await gears.nextIdToMint();
  //     await gears.airdrop(user1, 0, 15, 4, 100);
  //     const gear = await gears.gears(lastTokenId);
  //     expect(gear.rarity.toString()).to.be.equal("0");
  //     expect(gear.gearType.toString()).to.be.equal("15");
  //     expect(gear.category.toString()).to.be.equal("4");
  //     expect(gear.durability.toString()).to.be.equal("100");
  //   });
  // });

  describe("gamemanager open lootbox", () => {
    it("can not be opened by not owner", async () => {
      await d.setGameManager(owner);

      await lootboxes.mint(user1, 1, { from: owner });
      await lootboxes.mint(user1, 1, { from: owner });
      await expectRevert(
        gm.openLootbox(1, 0, { from: owner }),
        "You aren't this lootbox owner"
      );
    });

    it("can be opened by owner", async () => {
      await d.setGameManager(gm.address);
      await d.setCollectionManager(cm.address);

      const totalMintedGears = await gears.totalSupply();
      console.log("total minted gears", totalMintedGears.toString());
      const lastTokenId = await gears.nextIdToMint();
      console.log("lastTokenId", lastTokenId.toString());

      const openPrices = await cm.getLootboxOpeningPrice();
      console.log("common open price", openPrices["common"].toString());
      console.log("rare open price", openPrices["rare"].toString());
      console.log("legendary open price", openPrices["legendary"].toString());

      const gearToOpen = await gears.gears(1);

      const gearRarity = parseInt(gearToOpen["rarity"]);

      const openPrice =
        gearRarity === 0
          ? openPrices["common"]
          : gearRarity === 1
          ? openPrices["rare"]
          : openPrices["legendary"];

      await gm.openLootbox(1, openPrice.add(new BN(1)), {
        from: user1,
      });

      const mintedGearsAfter = await gears.totalSupply();
      // console.log("minted gears after", mintedGearsAfter.toString());
      expect(parseInt(mintedGearsAfter)).to.be.equal(
        parseInt(totalMintedGears) + 1
      );

      // const gear = await gears.gears(lastTokenId);
      // console.log("gear", gear);

      const owner = await gears.ownerOf(lastTokenId);
      // console.log("owner", owner);

      expect(owner).to.be.equal(user1);
    });

    it("can not open opened lootbox", async () => {
      await expectRevert(
        gm.openLootbox(1, new BN("1e24"), { from: user1 }),
        "ERC721: owner query for nonexistent token"
      );
    });

    it("open price too high", async () => {
      const gearToOpen = await gears.gears(2);
      const gearRarity = parseInt(gearToOpen["rarity"]);

      const openPrices = await cm.getLootboxOpeningPrice();
      const openPrice =
        gearRarity === 0
          ? openPrices["common"]
          : gearRarity === 1
          ? openPrices["rare"]
          : openPrices["legendary"];

      // price of one and clny increase
      await oracle.actualize("200000000000000000", { from: owner });

      await expectRevert(
        gm.openLootbox(2, openPrice.add(new BN(1)), { from: user1 }),
        "open price too high"
      );
    });

    it("can not open if not enough clny", async () => {
      const lootboxesSupply = await lootboxes.totalSupply();
      console.log("lootboxesSupply", lootboxesSupply.toString());
      const lastLootbox = await lootboxes.tokenByIndex(0);
      console.log("last lootbox", lastLootbox.toString());
      const clnyBalance = await clny.balanceOf(user1);
      console.log("clny balance", clnyBalance.toString());
      await clny.transfer(user2, clnyBalance.toString(), { from: user1 });

      const gearToOpen = await gears.gears(2);
      const gearRarity = parseInt(gearToOpen["rarity"]);

      const openPrices = await cm.getLootboxOpeningPrice();
      const openPrice =
        gearRarity === 0
          ? openPrices["common"]
          : gearRarity === 1
          ? openPrices["rare"]
          : openPrices["legendary"];

      await expectRevert(
        gm.openLootbox(2, openPrice.add(new BN(1)), { from: user1 }),
        "ERC20: burn amount exceeds balance"
      );
    });
  });

  describe("Gears locks by collection manager", () => {
    // it("can not lock more than 2 gears without special transport", async () => {
    //   await expectRevert(
    //     cm.setLocks([4, 5, 6], 0, { from: user1 }),
    //     "you can't lock so many gears"
    //   );
    // });

    // it("revert if not a transport sent as transport", async () => {
    //   await expectRevert(
    //     cm.setLocks(4, 5, 1, { from: user1 }),
    //     "transportId is not transport"
    //   );
    // });

    let user1transportId;
    let user1gear1;
    let user1gearSameCategoryAs1;
    let user1gear2;
    let user1gear3;

    let user2transportId;
    let user2gear;

    it("mint gears and transports for next tests", async () => {
      await d.setCollectionManager(owner);
      await gears.mint(user1, 2, 12, 4, 100);
      user1transportId = parseInt(await gears.lastTokenMinted(user1));
      // console.log({ user1transportId });

      await gears.mint(user1, 2, 1, 1, 100);
      user1gear1 = parseInt(await gears.lastTokenMinted(user1));

      await gears.mint(user1, 2, 2, 1, 100);
      user1gearSameCategoryAs1 = parseInt(await gears.lastTokenMinted(user1));

      await gears.mint(user1, 2, 3, 2, 100);
      user1gear2 = parseInt(await gears.lastTokenMinted(user1));
      // console.log({ secondGearId });

      await gears.mint(user1, 2, 4, 3, 100);
      user1gear3 = parseInt(await gears.lastTokenMinted(user1));

      await gears.mint(user2, 2, 12, 4, 100);
      user2transportId = parseInt(await gears.lastTokenMinted(user2));
      // console.log({ user2transportId });

      await gears.mint(user2, 2, 1, 1, 100);
      user2gear = parseInt(await gears.lastTokenMinted(user2));
      // console.log({ user2gearId });

      await d.setCollectionManager(cm.address);
    });

    // it("can not lock more than 3 gears with transport", async () => {
    //   await expectRevert(
    //     cm.setLocks([4, 5, 6, 5], user1transportId, { from: user1 }),
    //     "you can't lock so many gears"
    //   );
    // });

    it("can not lock if not a transport owner", async () => {
      await expectRevert(
        cm.setLocks(user2transportId, 0, 0, 0, {
          from: user1,
        }),
        "you are not transport owner"
      );
    });

    it("can not lock if not a transport", async () => {
      await expectRevert(
        cm.setLocks(user1gear1, 0, 0, 0, {
          from: user1,
        }),
        "transportId is not transport"
      );
    });

    it("can not lock if not a gear owner for any slots", async () => {
      await expectRevert(
        cm.setLocks(0, user2gear, 0, 0, {
          from: user1,
        }),
        "you are not gear owner"
      );

      await expectRevert(
        cm.setLocks(0, 0, user2gear, 0, {
          from: user1,
        }),
        "you are not gear owner"
      );

      await expectRevert(
        cm.setLocks(0, 0, 0, user2gear, {
          from: user1,
        }),
        "you are not gear owner"
      );

      await expectRevert(
        cm.setLocks(0, 0, 0, user2gear, {
          from: user1,
        }),
        "you are not gear owner"
      );
    });

    it("can not lock transport in gear slots", async () => {
      await expectRevert(
        cm.setLocks(0, user1transportId, 0, 0, {
          from: user1,
        }),
        "can not lock transport as gear"
      );
      await expectRevert(
        cm.setLocks(0, 0, user1transportId, 0, {
          from: user1,
        }),
        "can not lock transport as gear"
      );
      await expectRevert(
        cm.setLocks(0, 0, 0, user1transportId, {
          from: user1,
        }),
        "can not lock transport as gear"
      );
    });

    it("can not lock gears of the same category", async () => {
      await expectRevert(
        cm.setLocks(0, user1gear1, user1gearSameCategoryAs1, 0, {
          from: user1,
        }),
        "you can't lock gears of the same category"
      );
      await expectRevert(
        cm.setLocks(0, user1gear1, 0, user1gearSameCategoryAs1, {
          from: user1,
        }),
        "you can't lock gears of the same category"
      );

      await expectRevert(
        cm.setLocks(0, 0, user1gear1, user1gearSameCategoryAs1, {
          from: user1,
        }),
        "you can't lock gears of the same category"
      );
    });

    it("can not lock 3 gears if no transport locked", async () => {
      await expectRevert(
        cm.setLocks(0, user1gear1, user1gear2, user1gear3, {
          from: user1,
        }),
        "can not lock 3 gears without special transport"
      );
    });

    it("lock gears", async () => {
      await cm.setLocks(user1transportId, user1gear1, user1gear2, user1gear3, {
        from: user1,
      });

      const gear1 = await gears.gears(user1gear1);
      const gear2 = await gears.gears(user1gear2);
      const gear3 = await gears.gears(user1gear3);
      const transport = await gears.gears(user1transportId);

      expect(gear1.locked).to.be.equal(true);
      expect(gear2.locked).to.be.equal(true);
      expect(gear3.locked).to.be.equal(true);
      expect(transport.locked).to.be.equal(true);
    });

    it("lock other gears unlocks previous locked except still locked", async () => {
      await cm.setLocks(0, user1gear1, 0, 0, {
        from: user1,
      });

      const gearLocks = await cm.gearLocks(user1);
      console.log({ gearLocks });

      const gear1 = await gears.gears(user1gear1);
      const gear2 = await gears.gears(user1gear3);
      const transport = await gears.gears(user1transportId);

      // console.log({ gear1, gear2, transport });

      expect(gear1.locked).to.be.equal(true);
      expect(gear2.locked).to.be.equal(false);
      expect(transport.locked).to.be.equal(false);
    });

    it("unlocks all", async () => {
      await cm.setLocks(user1transportId, user1gear1, user1gear2, user1gear3, {
        from: user1,
      });

      const gearLocksBefore = await cm.gearLocks(user1);
      const unlocksBefore = parseInt(gearLocksBefore.locks);
      console.log({ unlocksBefore });

      await cm.setLocks(0, 0, 0, 0, {
        from: user1,
      });

      const gearLocks = await cm.gearLocks(user1);
      console.log({ gearLocks });

      expect(gearLocks.transportId).to.be.bignumber.equal(new BN(0));
      expect(gearLocks.gear1Id).to.be.bignumber.equal(new BN(0));
      expect(gearLocks.gear2Id).to.be.bignumber.equal(new BN(0));
      expect(gearLocks.gear3Id).to.be.bignumber.equal(new BN(0));

      const unlocksAfter = parseInt(gearLocks.locks);
      console.log({ unlocksAfter });

      expect(unlocksAfter - unlocksBefore).to.be.equal(1);
    });

    it("collection.getLockedGears", async () => {
      await cm.setLocks(user1transportId, user1gear1, user1gear2, user1gear3, {
        from: user1,
      });

      const result = await cm.getLockedGears(user1);
      console.log(result);
      console.log({ locksCount: parseInt(result.locksCount) });

      expect(result[0][0]).to.bignumber.be.equal(new BN(user1transportId));
      expect(result[0][1]).to.bignumber.be.equal(new BN(user1gear1));
      expect(result[0][2]).to.bignumber.be.equal(new BN(user1gear2));
      expect(result[0][3]).to.bignumber.be.equal(new BN(user1gear3));

      expect(result.locksCount).to.bignumber.be.equal(new BN(5));
    });
  });
});
