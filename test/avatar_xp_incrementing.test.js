const { expect } = require("chai");
const { time, expectRevert } = require("openzeppelin-test-helpers");

const GameManagerFixed = artifacts.require("GameManagerFixed");
const AvatarManager = artifacts.require("AvatarManager");

contract("AvatarManager", (accounts) => {
  const [user0, user1, user2] = accounts;
  const DAO = user0;

  let gm;
  let avatarManager;

  before(async () => {
    gm = await GameManagerFixed.deployed();
    avatarManager = await AvatarManager.deployed();

    await avatarManager.setMaxTokenId(5);
    await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
    await gm.claim([100], { value: web3.utils.toWei("0.1"), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
    await time.increase(60 * 60 * 24 * 365.25 * 1000); // wait 10 years
    await gm.claimEarned([100], { from: user1 }); // claim 3652.5 clny
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
  });

  describe("AvatarManager xp increase", function() {
    it("Set gm to user0; check addXP permissions", async () => {
      await expectRevert(avatarManager.addXP(1, 100), 'Only GameManager');
      await avatarManager.setGameManager(user0);
      const initialXP = await avatarManager.getXP([1, 2, 3]);
      expect(+initialXP[0]).to.be.equal(100);
      expect(+initialXP[1]).to.be.equal(100);
      expect(+initialXP[2]).to.be.equal(100);
      await avatarManager.addXP(1, 100);
      const xpAfterAdding = await avatarManager.getXP([1]);
      expect(+xpAfterAdding[0]).to.be.equal(200);
      await avatarManager.setGameManager(gm.address);
    });
  });
});
