const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GameManagerFixed = artifacts.require("GameManagerFixed");
const GEARS = artifacts.require("Gears");
const AVATARS = artifacts.require("MartianColonists");
const AM = artifacts.require("AvatarManager");
const MC = artifacts.require("MC");

contract("Gears", (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let gears;
  let avatars;
  let am;
  let mc;

  const baseUri = "baseuri.test/";

  before(async () => {
    gm = await GameManagerFixed.deployed();
    gears = await GEARS.deployed();
    avatars = await AVATARS.deployed();
    am = await AM.deployed();
    mc = await MC.deployed();

    await am.setMaxTokenId(5);
    await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
    await gm.claim([1], { value: web3.utils.toWei("0.1"), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
    await time.increase(60 * 60 * 24 * 365);
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

  describe("Mint", function() {
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

  // describe("TokenURI", function() {
  //   it("Returns correct URI with rarity part", async () => {
  //     const uri1 = await lbx.tokenURI(1);
  //     const uri2 = await lbx.tokenURI(2);
  //     const [base1, id1, rarity1] = uri1.split("/");
  //     expect(baseUri.startsWith(base1)).to.be.true;
  //     expect(id1).to.be.equal("1");
  //     expect(rarity1).to.be.equal("0");

  //     const [base2, id2, rarity2] = uri2.split("/");
  //     expect(baseUri.startsWith(base2)).to.be.true;
  //     expect(id2).to.be.equal("2");
  //     expect(rarity2).to.be.equal("1");
  //   });
  // });

  // describe("Open", function() {
  //   it("Reverts if open called not by game manager", async () => {
  //     await lbx.setGameManager(user1);
  //     const tx = lbx.open(1);
  //     await truffleAssert.reverts(tx, "only game manager");
  //   });

  //   it("Open lootbox", async () => {
  //     await lbx.setGameManager(DAO);
  //     await lbx.open(1);
  //     const isOpened = await lbx.opened(1);
  //     expect(isOpened).to.be.equal(true);

  //     const isNotOpened = await lbx.opened(2);
  //     expect(isNotOpened).to.be.equal(false);
  //   });
  // });

  // describe("Finish Mission", function() {
  //   const signer = {
  //     privateKey:
  //       "4028ea385a848c51ff76c0d968305e273d415335ccd06854630a8465b67a9eef",
  //     address: "0x5a636D26070A8a132E4731743CA12964CBB1950b",
  //   };

  //   it("Set message sender to backend sender", async () => {
  //     await gm.setBackendSigner(signer.address);
  //   });

  //   it("Mint avatar owner lootbox with common rarity ", async () => {
  //     await lbx.setGameManager(gm.address);
  //     const totalSupplyBefore = await lbx.totalSupply();

  //     const rarity = "01";

  //     const message = `1111111111111111111111111111111100002000022100010000000${rarity}1111111111111111111111`;
  //     const signature = await web3.eth.accounts.sign(
  //       message,
  //       signer.privateKey
  //     );

  //     const ownerOfAvatar = await avatars.ownerOf(1);

  //     await gm.finishMission(message, signature.v, signature.r, signature.s);

  //     const totalSupplyAfter = await lbx.totalSupply();
  //     expect((totalSupplyAfter - totalSupplyBefore).toString()).to.be.equal(
  //       "1"
  //     );

  //     const lootBoxOwner = await lbx.ownerOf(totalSupplyAfter);
  //     expect(lootBoxOwner).to.be.equal(ownerOfAvatar);

  //     const lootboxRarity = await lbx.rarities(totalSupplyAfter);
  //     // console.log({ lootboxRarity });
  //     expect(lootboxRarity.toString()).to.be.equal("0");
  //   });

  //   it("Mint avatar owner lootbox with legendary rarity ", async () => {
  //     await lbx.setGameManager(gm.address);

  //     const rarity = "03";

  //     const message = `1111111111111111111111111111111100002000022100010000000${rarity}1111111111111111111111`;
  //     const signature = await web3.eth.accounts.sign(
  //       message,
  //       signer.privateKey
  //     );

  //     await gm.finishMission(message, signature.v, signature.r, signature.s);

  //     const totalSupplyAfter = await lbx.totalSupply();
  //     const lootboxRarity = await lbx.rarities(totalSupplyAfter);
  //     expect(lootboxRarity.toString()).to.be.equal("2");
  //   });

  //   it("Doesn't mint avatar for land owner", async () => {
  //     const totalSupplyBefore = await lbx.totalSupply();
  //     const rarity = "00";
  //     const message = `1111111111111111111111111111111100002000020000110000000${rarity}1111111111111111111111`;
  //     const signature = await web3.eth.accounts.sign(
  //       message,
  //       signer.privateKey
  //     );

  //     await gm.finishMission(message, signature.v, signature.r, signature.s);

  //     const totalSupplyAfter = await lbx.totalSupply();

  //     expect(totalSupplyAfter - totalSupplyBefore).to.be.equal(0);
  //   });

  //   it("Increases lootBoxesToMint common field for land owner", async () => {
  //     const rarity = "23";
  //     const message = `1111111111111111111111111111111100002000020020010000000${rarity}1111111111111111111111`;
  //     const signature = await web3.eth.accounts.sign(
  //       message,
  //       signer.privateKey
  //     );

  //     await gm.finishMission(message, signature.v, signature.r, signature.s, {
  //       from: user2,
  //     });

  //     const landOwner = await mc.ownerOf(200);

  //     const lootBoxesToMintAfter = await gm.lootBoxesToMint(landOwner);

  //     expect(lootBoxesToMintAfter.common.toString()).to.be.equal("1");
  //   });

  //   it("Increases lootBoxesToMint legendary field for land owner", async () => {
  //     const rarity = "25";
  //     const message = `1111111111111111111111111111111100002000020020010000000${rarity}1111111111111111111111`;
  //     const signature = await web3.eth.accounts.sign(
  //       message,
  //       signer.privateKey
  //     );

  //     await gm.finishMission(message, signature.v, signature.r, signature.s, {
  //       from: user2,
  //     });

  //     const landOwner = await mc.ownerOf(200);

  //     const lootBoxesToMintAfter = await gm.lootBoxesToMint(landOwner);

  //     expect(lootBoxesToMintAfter.legendary.toString()).to.be.equal("1");
  //   });

  //   it("Mint legendary first", async () => {
  //     await gm.mintLootbox({ from: user2 });
  //     const totalSupply = await lbx.totalSupply();
  //     const lootBoxOwner = await lbx.ownerOf(totalSupply);

  //     const lootBoxesToMintAfter = await gm.lootBoxesToMint(lootBoxOwner);
  //     expect(lootBoxesToMintAfter.legendary.toString()).to.be.equal("0");

  //     const rarity = await lbx.rarities(totalSupply);
  //     expect(rarity.toString()).to.be.equal("2");
  //   });

  //   it("Mint common last", async () => {
  //     await gm.mintLootbox({ from: user2 });
  //     const totalSupply = await lbx.totalSupply();
  //     const lootBoxOwner = await lbx.ownerOf(totalSupply);

  //     const lootBoxesToMintAfter = await gm.lootBoxesToMint(lootBoxOwner);
  //     expect(lootBoxesToMintAfter.common.toString()).to.be.equal("0");

  //     const rarity = await lbx.rarities(totalSupply);
  //     expect(rarity.toString()).to.be.equal("0");
  //   });

  //   it("Reverts if no lootboxes to mint more", async () => {
  //     const tx = gm.mintLootbox({ from: user2 });
  //     await truffleAssert.reverts(tx, "you cannot mint lootbox");
  //   });
  // });

  // describe("Last owned token URI", async () => {
  //   it("Checks the function", async () => {
  //     await lbx.setGameManager(DAO);
  //     await lbx.mint(user1, 0);
  //     const balanceOf = +(await lbx.balanceOf(user1));
  //     const token = +(await lbx.tokenOfOwnerByIndex(user1, balanceOf - 1));
  //     const lastUriClassic = await lbx.tokenURI(token);
  //     await expectRevert(
  //       lbx.lastOwnedTokenURI(),
  //       "User hasn't minted any token"
  //     );
  //     const lastUri = await lbx.lastOwnedTokenURI({ from: user1 });
  //     expect(lastUri).to.be.equal(lastUriClassic);
  //     expect(lastUri).to.be.equal(baseUri + "10/0/");
  //   });
  // });

  // describe("All My Tokens Paginate", async () => {
  //   it("Checks the function", async () => {
  //     const twoFirstTokens = await lbx.allMyTokensPaginate(0, 1, {
  //       from: user1,
  //     });
  //     expect(twoFirstTokens[0].map((value) => +value)).to.be.eql([1, 3]);
  //     expect(twoFirstTokens[1].map((value) => +value)).to.be.eql([0, 2]);
  //     const upTo100FirstTokens = await lbx.allMyTokensPaginate(0, 99, {
  //       from: user1,
  //     });
  //     expect(upTo100FirstTokens[0].map((value) => +value)).to.be.eql([
  //       1,
  //       3,
  //       4,
  //       5,
  //       6,
  //       7,
  //       10,
  //     ]);
  //     expect(upTo100FirstTokens[1].map((value) => +value)).to.be.eql([
  //       0,
  //       2,
  //       1,
  //       0,
  //       0,
  //       2,
  //       0,
  //     ]);
  //   });
  // });

  // describe("GameManager burns a token", async () => {
  //   it("Not a GameManager can't burn", async () => {
  //     await expectRevert(lbx.burn(1, { from: user1 }), "only game manager");
  //   });
  //   it("GameManager can burn", async () => {
  //     // DAO is GM
  //     await lbx.burn(1, { from: DAO });
  //     await expectRevert(
  //       lbx.ownerOf(1),
  //       "ERC721: owner query for nonexistent token"
  //     );
  //   });
  // });
});
