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

    const totalLandsInitialCount = await mc.totalSupply();
    console.log("initial lands count:" + totalLandsInitialCount.toString());

    // await time.increase(60 * 60 * 24 * 10);

    // claim all lands
    await clny.setGameManager(accounts[0], { from: accounts[0] });
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
        const landId = Math.ceil(Math.random() * 21000);
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
    for (const account of accounts) {
      await clny.mint(account, "100000000000000000000000", 1, {
        from: accounts[0],
      });

      const userBalance = await clny.balanceOf(account);
      console.log("clny minted", account, userBalance.toString());
    }

    await clny.setGameManager(gm.address, { from: accounts[0] });

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

        const enh = await gm.getEnhancements(landId, { from: account });
        console.log("land " + landId + " has been built with units: ", {
          base: enh["0"].toString(),
          transport: enh["1"].toString(),
          robot: enh["2"].toString(),
          power: enh["3"].toString(),
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

    // mint gears
    await gears.setCollectionManager(accounts[0], { from: accounts[0] });
    await gears.mint(accounts[1], 0, 1, 1, 100);
    await gears.mint(accounts[1], 0, 2, 1, 150);
    await gears.lockGear(2);

    // oracle
    await oracle.addRelayer(accounts[0]);

    /*
    MISSION_MANAGER=0xC0633bcaB848D1738Ad22A05135C8E9EC9265092
    GAME_MANAGER=0xc65F8BA708814653EDdCe0e9f75827fe309E29aD
    AVATAR_MANAGER=0xdE165766CC7C48C556c8C20247b322Dd23EB313a
    MC=0xc268D8b64ce7DB6Eb8C29562Ae538005Fded299A
    MCLN=0xDEfafb07765D9D0F897260BE1389743A09802F20
    */
    console.log(`copy lines below and paste to the backend's .test.env

MISSION_MANAGER=${msn.address}
GAME_MANAGER=${gm.address}
COLLECTION_MANAGER=${collection.address}
MC=${mc.address}
MCLN=${nft.address}
CRYO=${cryo.address}
GEAR=${gears.address}
ORACLE=${oracle.address}
`);

    callback();
  } catch (error) {
    console.log(error);
  }
};
