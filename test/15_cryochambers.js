const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GM = artifacts.require("GameManager");
const CLNY = artifacts.require("CLNY");
const AvatarManager = artifacts.require("AvatarManager");
const NFT = artifacts.require("MartianColonists");
const CryochamberManager = artifacts.require("CryochamberManager");

contract("CryochamberManager", (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let clny;
  let avatars;
  let cryo;
  let nft;

  before(async () => {
    gm = await GM.deployed();
    clny = await CLNY.deployed();
    avatars = await AvatarManager.deployed();
    nft = await NFT.deployed();
    cryo = await CryochamberManager.deployed();
    await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
    await gm.claim([100], { value: web3.utils.toWei("0.1"), from: user1 });
    await time.increase(time.duration.years(1));
    await gm.claimEarned([100], { from: user1 });
    await gm.mintAvatar({ from: user1 }); // 1
    await gm.mintAvatar({ from: user2 }); // 2
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

    expect(clnyBalanceBefore - clnyBalanceAfter - cryoChamberPrice).to.be.equal(
      0
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

  it("send avatar to cryo success path", async () => {
    const cryoPeriodLength = await cryo.cryoPeriodLength();
    const cryoReward = await cryo.cryoXpAddition();
    const cryoEnergyCost = +(await cryo.cryoEnergyCost()).toString();

    const cryochamberBefore = await cryo.cryochambers(user1);
    const initialEnergy = +cryochamberBefore.energy.toString();

    await cryo.putAvatarInCryochamber(1, { from: user1 });

    const beginTime = await time.latest();
    const avatarCryo = await cryo.cryos(1);

    expect(+avatarCryo.endTime.toString() - beginTime).to.be.equal(
      +cryoPeriodLength.toString()
    );
    expect(+avatarCryo.reward.toString()).to.be.equal(+cryoReward.toString());

    const cryochamberAfter = await cryo.cryochambers(user1);
    const reducedEnergy = +cryochamberAfter.energy.toString();

    expect(initialEnergy - reducedEnergy).to.be.equal(cryoEnergyCost);
  });

  it("can not send not your avatar", async () => {
    const tx = cryo.putAvatarInCryochamber(2, { from: user1 });
    await truffleAssert.reverts(tx, "You are not an avatar owner");
  });

  it("can not send avatar when it in cryo already", async () => {
    const tx = cryo.putAvatarInCryochamber(1, { from: user1 });
    await truffleAssert.reverts(tx, "This avatar is in cryochamber already");
  });

  it("adds avatar xp when cryo has been finished", async () => {
    const initialXp = await avatars.getXP([1]);
    expect(+initialXp[0].toString()).to.be.equal(100);

    const cryoReward = await cryo.cryoXpAddition();

    await time.increase(time.duration.days(8)); // wait 8 days

    const newXp = await avatars.getXP([1]);
    expect(+newXp[0].toString()).to.be.equal(
      +initialXp.toString() + +cryoReward.toString()
    );
  });

  it("can not send avatar cryochamber energy off", async () => {
    await cryo.putAvatarInCryochamber(1, { from: user1 });
    await time.increase(time.duration.days(8)); // wait 8 days
    await cryo.putAvatarInCryochamber(1, { from: user1 });
    await time.increase(time.duration.days(8)); // wait 8 days
    await cryo.putAvatarInCryochamber(1, { from: user1 });
    await time.increase(time.duration.days(8)); // wait 8 days
    await cryo.putAvatarInCryochamber(1, { from: user1 });
    await time.increase(time.duration.days(8)); // wait 8 days
    const tx = cryo.putAvatarInCryochamber(1, { from: user1 });
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
});
