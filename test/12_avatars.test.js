const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GM = artifacts.require("GameManager");
const CLNY = artifacts.require("CLNY");
const AvatarManager = artifacts.require("AvatarManager");
const NFT = artifacts.require("MartianColonists");

contract("AvatarManager", (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let clny;
  let avatars;
  let nft;

  const ROYALTY1 = "0x352c478CD91BA54615Cc1eDFbA4A3E7EC9f60EE1";
  const ROYALTY2 = "0x2581A6C674D84dAD92A81E8d3072C9561c21B935";

  before(async () => {
    gm = await GM.deployed();
    clny = await CLNY.deployed();
    avatars = await AvatarManager.deployed();
    nft = await NFT.deployed();
    await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
    await gm.claim([100], { value: web3.utils.toWei("0.1"), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
    await time.increase(60 * 60 * 24 * 365);
    await gm.claimEarned([100], { from: user1 });
    await gm.claimEarned([200], { from: user2 });
    await avatars.setMaxTokenId(5);
  });

  it("Mint avatars", async () => {
    const supplyBefore = await clny.totalSupply();
    expect(parseInt(await nft.totalSupply())).to.be.equal(0);
    await gm.mintAvatar({ from: user1 });
    const supplyAfterMint = await clny.totalSupply();
    expect(
      Math.round(
        (parseInt(supplyAfterMint) - parseInt(supplyBefore)) * 1e-18 * 10
      )
    ).to.be.equal(-291);
    // const royalty1 = parseInt(await clny.balanceOf(ROYALTY1));
    const royalty2 = parseInt(await clny.balanceOf(ROYALTY2));
    // expect(royalty1).to.be.equal(0.6 * 1e18);
    expect(royalty2).to.be.equal(0.9 * 1e18);
    expect(parseInt(await nft.totalSupply())).to.be.equal(1);
    await gm.mintAvatar({ from: user2 });
    expect(parseInt(await nft.totalSupply())).to.be.equal(2);
    const ownerOf1 = await nft.ownerOf(1);
    const ownerOf2 = await nft.ownerOf(2);
    expect(ownerOf1).to.be.equal(user1);
    expect(ownerOf2).to.be.equal(user2);
    expect(await avatars.ableToMint()).to.be.true;
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
    expect(parseInt(await nft.totalSupply())).to.be.equal(5);
    // 10 minted
    expect(await avatars.ableToMint()).to.be.false;
    await expectRevert(gm.mintAvatar({ from: user1 }), "cannot mint");
    await expectRevert(avatars.setMaxTokenId(15, { from: user1 }), "Only DAO");
    await avatars.setMaxTokenId(15, { from: DAO });
    expect(await avatars.ableToMint()).to.be.true;
    await gm.mintAvatar({ from: user1 });

    const names = await avatars.getNames([1, 2, 3]);
    expect(names).to.be.eql(["", "", ""]);

    await avatars.setName(1, "zero", { from: user1 });
    await avatars.setName(2, "one", { from: user2 });
    await avatars.setName(3, "two", { from: user1 });

    const names2 = await avatars.getNames([1, 2, 3]);
    expect(names2).to.be.eql(["zero", "one", "two"]);

    await expectRevert(
      avatars.setName(1, "zero-2", { from: user1 }),
      "name is already set"
    );
  });

  it("rename avatar", async () => {
    await expectRevert(avatars.setNameByGameManager(1, 'test', { from: user1 }), 'Only GameManager');
    await expectRevert(gm.renameAvatar(1, 'test', { from: user2 }), 'You are not the owner');
    const clnyBalance = await clny.balanceOf(user1);
    await gm.renameAvatar(1, 'test', { from: user1 });
    const clnyBalanceAfter = await clny.balanceOf(user1);
    expect(clnyBalance - clnyBalanceAfter).to.be.equal(25 * 1e18);
    await expectRevert(gm.renameAvatar(1, 'test', { from: user1 }), 'same name');
  });

  it("reverts on trying to getXP of unexisted avatar", async () => {
    await expectRevert(
      avatars.getXP([100], { from: user1 }),
      "wrong avatarId requested"
    );
  });

  it("returns default xp for existing avatar", async () => {
    const xp = await avatars.getXP([1, 2]);
    expect(Array.isArray(xp)).to.be.true;
    expect(xp.length).to.be.equal(2);
    expect(parseInt(xp[0])).to.be.equal(100);
  });
});
