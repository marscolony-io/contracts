const { expect } = require('chai');
const { time, expectRevert, BN } = require('openzeppelin-test-helpers');

const GameManagerFixed = artifacts.require('GameManagerFixed');
const CLNY = artifacts.require('CLNY');
const CollectionManager = artifacts.require('CollectionManager');
const NFT = artifacts.require('MartianColonists');
const Dependencies = artifacts.require('Dependencies');

contract('CollectionManager', accounts => {
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
    await gm.setPrice(web3.utils.toWei('0.1'), { from: DAO });
    await gm.claim([100], { value: web3.utils.toWei('0.1'), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei('0.1'), from: user2 });
    await time.increase(60 * 60 * 24 * 365);
    await gm.claimEarned([100], { from: user1 });
    await gm.claimEarned([200], { from: user2 });
    await collection.setMaxTokenId(5);
    await gm.mintAvatar({ from: user1 });
    await d.setGameManager(DAO, { from: DAO });
  });

  it('initial condition is 50%', async () => {
    const condition = await collection.getTransportCondition(user1);
    expect(condition).to.bignumber.be.equal(new BN(500));
  });

  it('Increase transport damage', async () => {
    await collection.increaseTransportDamage(user1, 10, { from: DAO });
    const condition = await collection.getTransportCondition(user1);
    expect(condition).to.bignumber.be.equal(new BN(490));
  });

  it('can not damage below 0', async () => {
    await collection.increaseTransportDamage(user1, 1000, { from: DAO });
    const condition = await collection.getTransportCondition(user1);
    expect(condition).to.bignumber.be.equal(new BN(0));
  });

  it('repair to 50 percents', async () => {
    await collection.repairTransport(user1, 500, { from: DAO });
    const condition = await collection.getTransportCondition(user1);
    expect(condition).to.bignumber.be.equal(new BN(500));
  });

  it('repair can not be above 100 percents', async () => {
    await collection.repairTransport(user1, 1000, { from: DAO });
    const condition = await collection.getTransportCondition(user1);
    expect(condition).to.bignumber.be.equal(new BN(750));
  });

  it("avatars all tokens paginate", async () => {
    const totalAvatarsSupply = await nft.totalSupply();
    console.log("total avatars supply", parseInt(totalAvatarsSupply));
    expect(parseInt(totalAvatarsSupply)).to.be.equal(1);

    await d.setCollectionManager(DAO);
    await nft.setName(1, "avatar");

    await collection.addXP(1, 100);

    const result = await collection.allTokensPaginate(0, 1000);
    console.log("all tokens paginate response", result);
    expect(result[0].length).to.be.equal(1);
    expect(result[1].length).to.be.equal(1);
    expect(result[1][0].name).to.be.equal("avatar");
    expect(result[1][0].xp).to.be.bignumber.equal(new BN("100"));
    expect(result[1][0].owner).to.be.equal(user1);
  });
});
