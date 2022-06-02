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

  describe("Cryochamber purchases", () => {
    it("Purchase cryochamber first time success", async () => {
      const cryochamberAddress = await gm.cryochamberAddress();
      let cryochamber = await cryo.cryochambers(user1);
      expect(cryochamber.isSet).to.be.false;

      await gm.purchaseCryochamber({ from: user1 });
      console.log({ cryochamberAddress });

      cryochamber = await cryo.cryochambers(user1);
      expect(cryochamber.isSet).to.be.true;
    });
  });
});
