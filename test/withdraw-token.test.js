const { expect } = require("chai");
const { time, expectRevert } = require("openzeppelin-test-helpers");

const GameManagerFixed = artifacts.require("GameManagerFixed");
const MC = artifacts.require("MC");
const CM = artifacts.require("CollectionManager");
const MCL = artifacts.require("MartianColonists");
const CLNY = artifacts.require("CLNY");

contract("Withdraw tokens", (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let mc;
  let clny;
  let cm;
  let mcl;

  before(async () => {
    gm = await GameManagerFixed.deployed();
    mc = await MC.deployed();
    clny = await CLNY.deployed();
    cm = await CM.deployed();
    mcl = await MCL.deployed();
    await gm.setPrice(web3.utils.toWei("1"), { from: DAO });
    const fee = await gm.getFee(1);
    await gm.claim([100], { value: fee, from: user1 });
    await time.increase(60 * 60 * 24 * 365);
    await gm.claimEarned([100], { from: user1 });
    // move token to contract
    await clny.transfer(clny.address, web3.utils.toWei("1"), { from: user1 });
    await clny.transfer(mc.address, web3.utils.toWei("1"), { from: user1 });
    await clny.transfer(gm.address, web3.utils.toWei("1"), { from: user1 });
    await clny.transfer(cm.address, web3.utils.toWei("1"), { from: user1 });
    await clny.transfer(mcl.address, web3.utils.toWei("1"), { from: user1 });
  });

  it("Check tokens", async () => {
    const clnyBalances = [
      await clny.balanceOf(clny.address),
      await clny.balanceOf(mc.address),
      await clny.balanceOf(gm.address),
      await clny.balanceOf(cm.address),
      await clny.balanceOf(mcl.address),
    ].map((x) => parseInt(x) * 1e-18);
    expect(clnyBalances).to.be.eql([1, 1, 1, 1, 1]);

    await expectRevert(
      clny.withdrawToken(clny.address, user2, web3.utils.toWei("1"), {
        from: user1,
      }),
      "Only DAO"
    );
    await clny.withdrawToken(clny.address, user2, web3.utils.toWei("1"), {
      from: DAO,
    });

    await expectRevert(
      mc.withdrawToken(clny.address, user2, web3.utils.toWei("1"), {
        from: user1,
      }),
      "Ownable: caller is not the owner"
    );
    await mc.withdrawToken(clny.address, user2, web3.utils.toWei("1"), {
      from: DAO,
    });

    await expectRevert(
      gm.withdrawToken(clny.address, user2, web3.utils.toWei("1"), {
        from: user1,
      }),
      "Only DAO"
    );
    await gm.withdrawToken(clny.address, user2, web3.utils.toWei("1"), {
      from: DAO,
    });

    await expectRevert(
      cm.withdrawToken(clny.address, user2, web3.utils.toWei("1"), {
        from: user1,
      }),
      "Only DAO"
    );
    await cm.withdrawToken(clny.address, user2, web3.utils.toWei("1"), {
      from: DAO,
    });

    await expectRevert(
      mcl.withdrawToken(clny.address, user2, web3.utils.toWei("1"), {
        from: user1,
      }),
      "caller is not the owner"
    );
    await mcl.withdrawToken(clny.address, user2, web3.utils.toWei("1"), {
      from: DAO,
    });

    const clnyBalances2 = [
      await clny.balanceOf(clny.address),
      await clny.balanceOf(mc.address),
      await clny.balanceOf(gm.address),
      await clny.balanceOf(cm.address),
      await clny.balanceOf(mcl.address),
    ].map((x) => parseInt(x) * 1e-18);
    expect(clnyBalances2).to.be.eql([0, 0, 0, 0, 0]);
  });
});
