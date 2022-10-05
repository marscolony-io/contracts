const { time } = require("openzeppelin-test-helpers");
const GM = artifacts.require("GameManagerFixed");
const MC = artifacts.require("MC");
const MSN = artifacts.require("MissionManager");
const CLNY = artifacts.require("CLNY");
const COLONISTS = artifacts.require("MartianColonists");
const CollectionManager = artifacts.require("CollectionManager");
const GEARS = artifacts.require("Gears");
const ORACLE = artifacts.require("Oracle");
const CryochamberManager = artifacts.require("CryochamberManager");
const Dependencies = artifacts.require("Dependencies");

module.exports = async (callback) => {
  try {
    console.log("--START FILLING DATA FOR THE BACKEND--");

    const accounts = await web3.eth.getAccounts();
    const mc = await MC.deployed();
    const msn = await MSN.deployed();
    const gm = await GM.deployed();
    const clny = await CLNY.deployed();
    const nft = await COLONISTS.deployed();
    const cryo = await CryochamberManager.deployed();
    let collection = await CollectionManager.deployed();
    const gears = await GEARS.deployed();
    const oracle = await ORACLE.deployed();
    const d = await Dependencies.deployed();

    const totalLandsInitialCount = await mc.totalSupply();
    console.log("initial lands count:" + totalLandsInitialCount.toString());

    // await time.increase(60 * 60 * 24 * 10);

    // claim all lands
    // await clny.setGameManager(accounts[0], { from: accounts[0] });
    await gm.setPrice(web3.utils.toWei("0.1"), { from: accounts[0] });

    const claimedLands = new Set();
    const userLandsMap = new Map();
    const landUserMap = new Map();
    let privateUsers = new Set();

    for (let userId = 0; userId < 10; userId++) {
      const userLandsIds = [];

      //user 4 has 2 lands not private and with max revshares
      const userLandsCount = userId === 4 ? 2 : Math.floor(Math.random() * 10);
      console.log(`claim ${userLandsCount} lands for user `, userId);

      while (userLandsIds.length < userLandsCount) {
        const landId = Math.ceil(Math.random() * 20999);
        // console.log({ landId });
        if (claimedLands.has(landId)) continue;

        userLandsIds.push(landId);
        claimedLands.add(landId);
        const userLands = userLandsMap.get(accounts[userId]);
        if (!userLands) {
          userLandsMap.set(accounts[userId], [landId]);
        } else {
          userLandsMap.set(accounts[userId], [...userLands, landId]);
        }

        landUserMap.set(landId, accounts[userId]);
      }

      // console.log({ userLandsIds });

      if (userLandsIds.length) {
        await gm.claim(userLandsIds, {
          value: web3.utils.toWei((userLandsCount / 10).toString()),
          from: accounts[userId],
        });
      }

      // set some acounts private except user 4

      if (Math.random() < 0.5 && userId !== 4) {
        console.log(`set user ${userId} private`);
        await msn.setAccountPrivacy(true, { from: accounts[userId] });
        privateUsers.add(accounts[userId]);
      }
    }

    const claimedLandsInitialCount = await mc.totalSupply();
    console.log(
      "total claimed lands count:" + claimedLandsInitialCount.toString()
    );

    console.log(landUserMap);
    console.log(userLandsMap);

    //  mint clny to users
    await d.setGameManager(accounts[0], { from: accounts[0] });

    for (const account of accounts) {
      await clny.mint(account, "100000000000000000000000", 1, {
        from: accounts[0],
      });

      const userBalance = await clny.balanceOf(account);
      console.log("clny minted", account, userBalance.toString());
    }

    await d.setGameManager(gm.address, { from: accounts[0] });

    // mint avatars

    const avatarsCountBefore = await nft.totalSupply();
    console.log("avatarsCountBefore", avatarsCountBefore.toString());

    await collection.setMaxTokenId(20, { from: accounts[0] });

    for (const account of accounts) {
      console.log("mint avatar for account", account);
      await gm.mintAvatar({ from: account });
    }

    const avatarsCountAfter = await nft.totalSupply();
    console.log("avatarsCountAfter", avatarsCountAfter.toString());

    const ownerOf1 = await nft.ownerOf(1);
    console.log("ownerOf1", ownerOf1);

    // build stations
    for (const account of accounts) {
      if (!userLandsMap.has(account)) continue;
      for (const landId of userLandsMap.get(account)) {
        if (Math.random() < 0.7) {
          console.log("build base station for land", landId);
          await gm.buildAndPlaceBaseStation(landId, 5, 7, {
            from: account,
          });
          if (Math.random() < 0.7) {
            await gm.buildTransport(landId, 1, { from: account });
            await gm.buildRobotAssembly(landId, 1, { from: account });
            await gm.buildPowerProduction(landId, 1, { from: account });
            if (Math.random() < 0.7) {
              await gm.buildTransport(landId, 2, { from: account });
              await gm.buildRobotAssembly(landId, 2, { from: account });
              await gm.buildPowerProduction(landId, 2, { from: account });
              if (Math.random() < 0.7) {
                await gm.buildTransport(landId, 3, { from: account });
                await gm.buildRobotAssembly(landId, 3, { from: account });
                await gm.buildPowerProduction(landId, 3, { from: account });
              }
            }
          }
        }

        const attr = (
          await gm.getAttributesMany([landId], { from: account })
        )[0];
        console.log("land attr", attr);
        console.log("land " + landId + " has been built with units: ", {
          base: attr.baseStation,
          transport: attr.transport,
          robot: attr.robotAssembly,
          power: attr.powerProduction,
        });
      }
    }

    // mint avatar for cryocamera
    // await gm.mintAvatar({ from: accounts[1] });
    // const avatarId = await nft.totalSupply();
    // console.log("id of the avatar in cryochamber", parseInt(avatarId));
    // await gm.purchaseCryochamber({ from: accounts[1] });
    // console.log(1);
    // await cryo.putAvatarsInCryochamber([avatarId], { from: accounts[1] });
    // console.log(2);
    // // set max revshares for two users
    // console.log("set revshare 90 for user4");
    // await msn.setAccountRevshare(90, { from: accounts[4] });

    // mint gears and lock for use in backend server tests
    await d.setCollectionManager(accounts[1], { from: accounts[0] });
    await gears.mint(accounts[1], 0, 1, 1, 100, { from: accounts[1] });
    await gears.mint(accounts[1], 0, 2, 1, 150, { from: accounts[1] });
    await gears.lockGear(1, { from: accounts[1] });
    await gears.lockGear(2, { from: accounts[1] });
    await d.setCollectionManager(collection.address, {
      from: accounts[0],
    });

    // oracle
    await oracle.addRelayer(accounts[0]);

    // user to test mining mission

    const ownerOf3 = await nft.ownerOf(3);
    console.log("owner Of avatar 3", ownerOf3);

    await gm.claim([21000], {
      value: web3.utils.toWei((0.1).toString()),
      from: ownerOf3,
    });

    const avatar3OwnerLand = 21000; // userLandsMap.get(ownerOf3);
    console.log({ avatar3OwnerLand });
    claimedLands.add(21000);

    await gm.buildAndPlaceBaseStation(avatar3OwnerLand, 5, 7, {
      from: ownerOf3,
    });

    await gm.buildTransport(avatar3OwnerLand, 1, { from: ownerOf3 });
    await gm.buildRobotAssembly(avatar3OwnerLand, 1, { from: ownerOf3 });
    await gm.buildPowerProduction(avatar3OwnerLand, 1, { from: ownerOf3 });

    await gm.buildTransport(avatar3OwnerLand, 2, { from: ownerOf3 });
    await gm.buildRobotAssembly(avatar3OwnerLand, 2, { from: ownerOf3 });
    await gm.buildPowerProduction(avatar3OwnerLand, 2, { from: ownerOf3 });

    await gm.buildTransport(avatar3OwnerLand, 3, { from: ownerOf3 });
    await gm.buildRobotAssembly(avatar3OwnerLand, 3, { from: ownerOf3 });
    await gm.buildPowerProduction(avatar3OwnerLand, 3, {
      from: ownerOf3,
    });

    await d.setCollectionManager(accounts[0], { from: accounts[0] });
    await gears.mint(ownerOf3, 0, 0, 1, 1, { from: accounts[0] });
    await gears.mint(ownerOf3, 0, 7, 3, 1, { from: accounts[0] });
    await gears.mint(ownerOf3, 1, 5, 2, 150, { from: accounts[0] });
    await gears.mint(ownerOf3, 2, 12, 4, 150, { from: accounts[0] });

    await d.setCollectionManager(collection.address, {
      from: accounts[0],
    });

    const lastGearId = parseInt(await gears.totalSupply());
    console.log({ lastGearId: lastGearId });

    const gear = await gears.gears(lastGearId);
    console.log({ gear: parseInt(gear.category) });

    await collection.setLocks(
      lastGearId,
      lastGearId - 1,
      lastGearId - 2,
      lastGearId - 3,
      {
        from: ownerOf3,
      }
    );

    // claim all other lands for test server hot restart delays
    for (let i = 1; i < 21000; i++) {
      if (!claimedLands.has(i)) {
        console.log("airdrop", i);
        await gm.airdrop(accounts[9], i);
      }
    }

    // ---

    console.log(`copy lines below and paste to the backend's .test.env

MISSION_MANAGER=${msn.address}
GAME_MANAGER=${gm.address}
COLLECTION_MANAGER=${collection.address}
MC=${mc.address}
MCLN=${nft.address}
CRYO=${cryo.address}
GEARS=${gears.address}
ORACLE=${oracle.address}
TEST_PLAYER=${ownerOf3}
TEST_PLAYER_LAND=${avatar3OwnerLand}
`);

    callback();
  } catch (error) {
    console.log(error);
  }
};
