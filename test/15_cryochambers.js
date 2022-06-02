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
    await time.increase(60 * 60 * 24 * 365);
    await gm.claimEarned([100], { from: user1 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
  });

  it("Purchase cryochamber energy before buying cryochabmer fails", async () => {
    const tx = gm.purchaseCryochamberEnergy(5);
    await truffleAssert.reverts(tx, "you have not purchased cryochamber yet");
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

  it("Purchase cryochamber energy after buying cryochabmer success", async () => {
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
