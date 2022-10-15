const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GameManagerFixed = artifacts.require("GameManagerFixed");
const CLNY = artifacts.require("CLNY");
const CollectionManager = artifacts.require("CollectionManager");
const MCL = artifacts.require("MartianColonists");
const NFT = artifacts.require("MartianColonists");
const CryochamberManager = artifacts.require("CryochamberManager");

contract("CryochamberManager", (accounts) => {
  const [owner, user1, user2] = accounts;

  let gm;
  let clny;
  let collection;
  let mcl;
  let cryo;
  let nft;

  before(async () => {
    gm = await GameManagerFixed.deployed();
    clny = await CLNY.deployed();
    collection = await CollectionManager.deployed();
    mcl = await MCL.deployed();
    nft = await NFT.deployed();
    cryo = await CryochamberManager.deployed();
    await collection.setMaxTokenId(5);
    await gm.setPrice(web3.utils.toWei("0.1"), { from: owner });
    await gm.claim([100], { value: web3.utils.toWei("0.1"), from: user1 });
    await gm.claim([101], { value: web3.utils.toWei("0.1"), from: user2 });
    await time.increase(time.duration.years(1));
    await gm.claimEarned([100], { from: user1 });
    await gm.claimEarned([101], { from: user2 });
    await gm.mintAvatar({ from: user1 }); // 1
    await gm.mintAvatar({ from: user2 }); // 2
    await gm.mintAvatar({ from: user1 }); // 3
  });

  it("Purchase cryochamber energy before buying cryochabmer fails", async () => {
    const tx = gm.purchaseCryochamberEnergy(5);
    await truffleAssert.reverts(tx, "You have not purchased cryochamber yet");
  });

  it("send avatar to cryo fails if no chamber purchased", async () => {
    const tx = cryo.putAvatarsInCryochamber([1]);
    await truffleAssert.reverts(tx, "You have not purchased cryochamber yet");
  });

  it("Purchase cryochamber first time success", async () => {
    const initialEnergy = await cryo.initialEnergy();
    const clnyBalanceBefore = await clny.balanceOf(user1);
    const cryochamberBefore = await cryo.cryochambers(user1);
    expect(cryochamberBefore.isSet).to.be.false;

    await gm.purchaseCryochamber({ from: user1 });

    const cryochamberAfter = await cryo.cryochambers(user1);
    expect(cryochamberAfter.isSet).to.be.true;
    expect(cryochamberAfter.energy.toString()).to.be.equal(
      initialEnergy.toString()
    );

    const clnyBalanceAfter = await clny.balanceOf(user1);
    const cryoChamberPrice = await cryo.cryochamberPrice();
    
    expect(Math.abs(clnyBalanceBefore - clnyBalanceAfter - cryoChamberPrice)).to.be.lessThan(
      100000 // possible delta
    );
  });

  it("Purchase cryochamber second time failure", async () => {
    let cryochamber = await cryo.cryochambers(user1);
    expect(cryochamber.isSet).to.be.true;

    const tx = gm.purchaseCryochamber({ from: user1 });
    await truffleAssert.reverts(
      tx,
      "you have already purchased the cryochamber"
    );
  });

  it("send avatars to cryo success path", async () => {
    const cryoPeriodLength = await cryo.cryoPeriodLength();
    const cryoReward = (await cryo.estimateXpAddition(1)) * 7;
    const cryoEnergyCost = +(await cryo.cryoEnergyCost()).toString();

    const cryochamberBefore = await cryo.cryochambers(user1);
    const initialEnergy = +cryochamberBefore.energy.toString();

    await cryo.putAvatarsInCryochamber([1], { from: user1 });

    const beginTime = await time.latest();
    const avatarCryo = await cryo.getAvatarCryoStatus(1);

    expect(parseInt(avatarCryo.endTime) - beginTime).to.be.equal(
      parseInt(cryoPeriodLength)
    );
    expect(parseInt(avatarCryo.reward)).to.be.equal(parseInt(cryoReward));

    const cryochamberAfter = await cryo.cryochambers(user1);
    const reducedEnergy = parseInt(cryochamberAfter.energy);

    expect(initialEnergy - reducedEnergy).to.be.equal(cryoEnergyCost);
  });

  it("can not send not your avatar", async () => {
    const tx = cryo.putAvatarsInCryochamber([2], { from: user1 });
    await truffleAssert.reverts(tx, "You are not an avatar owner");
  });

  it("can not send avatar when it in cryo already", async () => {
    const tx = cryo.putAvatarsInCryochamber([1], { from: user1 });
    await truffleAssert.reverts(tx, "This avatar is in cryochamber already");
  });

  it("adds avatar xp when cryo has been finished", async () => {
    const initialXp = await collection.getXP([1]);
    expect(parseInt(initialXp[0])).to.be.equal(100);

    const cryoReward = (await cryo.estimateXpAddition(1)) * 7;
    await time.increase(time.duration.days(8)); // wait 8 days

    const newXp = await collection.getXP([1]);
    expect(parseInt(newXp[0])).to.be.equal(
      parseInt(initialXp) + parseInt(cryoReward)
    );
  });

  it("can not send avatar cryochamber energy off", async () => {
    await cryo.putAvatarsInCryochamber([1], { from: user1 });
    await time.increase(time.duration.days(8)); // wait 8 days
    await cryo.putAvatarsInCryochamber([1], { from: user1 });
    await time.increase(time.duration.days(8)); // wait 8 days
    await cryo.putAvatarsInCryochamber([1], { from: user1 });
    await time.increase(time.duration.days(8)); // wait 8 days
    await cryo.putAvatarsInCryochamber([1], { from: user1 });
    await time.increase(time.duration.days(8)); // wait 8 days
    const tx = cryo.putAvatarsInCryochamber([1], { from: user1 });
    await truffleAssert.reverts(
      tx,
      "You have not enough energy in cryochamber, please buy more"
    );
  });

  it("Purchase cryochamber energy after buying cryochamber success", async () => {
    const energyPrice = await cryo.energyPrice();

    let chamber = await cryo.cryochambers(user1);

    const energyBefore = chamber.energy;
    const clnyBalanceBefore = await clny.balanceOf(user1);

    await gm.purchaseCryochamberEnergy(5, { from: user1 });

    const clnyBalanceAfter = await clny.balanceOf(user1);
    chamber = await cryo.cryochambers(user1);
    const energyAfter = chamber.energy;

    expect(energyAfter - energyBefore).to.be.equal(5);
    expect(clnyBalanceBefore - clnyBalanceAfter).to.be.equal(5 * energyPrice);
  });

  it("send many avatars to cryo success path", async () => {
    const cryoEnergyCost = parseInt(await cryo.cryoEnergyCost());

    const cryochamberBefore = await cryo.cryochambers(user1);
    const initialEnergy = parseInt(cryochamberBefore.energy);

    await cryo.putAvatarsInCryochamber([1, 3], { from: user1 });

    const cryochamberAfter = await cryo.cryochambers(user1);
    const reducedEnergy = parseInt(cryochamberAfter.energy);

    expect(initialEnergy - reducedEnergy).to.be.equal(cryoEnergyCost * 2);
  });

  it("returns correct isInCryoChamber result", async () => {
    const cryoPeriodLength = await cryo.cryoPeriodLength();
    const isInCryoChamberResultsBefore = await cryo.isInCryoChamber([1, 2, 3]);

    expect(parseInt(isInCryoChamberResultsBefore[0])).to.be.equals(
      parseInt(cryoPeriodLength)
    );

    expect(parseInt(isInCryoChamberResultsBefore[1])).to.be.equals(0);

    await time.increase(time.duration.minutes(1));

    const isInCryoChamberResultsAfter = await cryo.isInCryoChamber([1, 2, 3]);

    expect(parseInt(isInCryoChamberResultsAfter[0])).to.be.lte(
      parseInt(cryoPeriodLength - 60)
    );

    expect(parseInt(isInCryoChamberResultsAfter[1])).to.be.lte(0);
  });

  it("cryoXpAddition level 1", async () => {
    const num = await cryo.cryoXpAddition(100);
    expect(parseInt(num)).to.be.equal(400);
  });

  it("cryoXpAddition level 33", async () => {
    const num = await cryo.cryoXpAddition(748000);
    expect(parseInt(num)).to.be.equal(18790);
  });

  // not passed high levels because of high pow()
  it("cryoXpAddition level than 100", async () => {
    const num = await cryo.cryoXpAddition(11668237635);
    expect(parseInt(num)).to.be.equal(37286725);
  });

  it("cryoXpAddition level more than 100", async () => {
    const num = await cryo.cryoXpAddition(11668237637);
    console.log(parseInt(num));
    expect(parseInt(num)).to.be.equal(37286725);
  });

  it("bulk estimate xp additions", async () => {
    const xps = await collection.getXP([1, 2, 3]);
    // console.log(xps.map((xp) => xp.toString()));
    const xpAdditions = await cryo.bulkEstimateXpAddition([1, 2, 3]);
    // console.log(xpAdditions.map((xpAddition) => xpAddition.toString()));

    expect(await cryo.estimateXpAddition(1)).to.bignumber.be.equal(
      new BN("2443")
    );

    expect(parseInt(xpAdditions[0])).to.be.equal(2443);
    expect(parseInt(xpAdditions[1])).to.be.equal(400);
    expect(parseInt(xpAdditions[2])).to.be.equal(400);
  });
});
