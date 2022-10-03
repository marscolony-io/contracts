const { expect } = require("chai");
const { time, expectRevert, BN } = require("openzeppelin-test-helpers");

const GameManagerFixed = artifacts.require("GameManagerFixed");
const CLNY = artifacts.require("CLNY");
const CollectionManager = artifacts.require("CollectionManager");
const NFT = artifacts.require("MartianColonists");
const Dependencies = artifacts.require("Dependencies");

contract("CollectionManager", (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let clny;
  let collection;
  let nft;
  let d;

  before(async () => {
    gm = await GameManagerFixed.deployed();
    clny = await CLNY.deployed();
    collection = await CollectionManager.deployed();
    nft = await NFT.deployed();
    d = await Dependencies.deployed();
    await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
    await gm.claim([100], { value: web3.utils.toWei("0.1"), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
    await time.increase(60 * 60 * 24 * 365);
    await gm.claimEarned([100], { from: user1 });
    await gm.claimEarned([200], { from: user2 });
    await collection.setMaxTokenId(5);
    await gm.mintAvatar({ from: user1 });
  });

  it("Increase transport damage", async () => {
    const initialDamage = await collection.transportDamage(user1);

    // await collection.setGameManager(DAO, { from: DAO });
    await d.setGameManager(DAO, { from: DAO });
    await collection.increaseTransortDamage(user1, 10, { from: DAO });

    const damage = await collection.transportDamage(user1);

    expect(damage).to.bignumber.be.equal(new BN(10));
  });

  it("Damage can not be more than 100", async () => {
    await collection.increaseTransortDamage(user1, 100, { from: DAO });

    const damage = await collection.transportDamage(user1);

    expect(damage).to.bignumber.be.equal(new BN(100));
  });
});
