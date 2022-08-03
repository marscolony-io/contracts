const NFT = artifacts.require("MC");
const SalesManager = artifacts.require("SalesManager");
const GM = artifacts.require("GameManager");
const CLNY = artifacts.require('CLNY');
const { expect } = require("chai")
const {
  expectRevert,
  ether,
  time,
  balance
} = require('openzeppelin-test-helpers');

contract("Onglobe Marketplace", (accounts) => {
  const [DAO, user1, user2, user3] = accounts
  let gm;
  let nft;
  let salesManager;
  let clny;

  before(async function () {
    gm = await GM.deployed();
    nft = await NFT.deployed();
    salesManager = await SalesManager.deployed();
    clny = await CLNY.deployed();
    await nft.setGameManager(GM.address, { from: DAO });
    await salesManager.setGameManager(GM.address, { from: DAO });
    await salesManager.setRoyaltyAddress(user3, { from: DAO });
    await gm.setTradeBurnAmount(200);
    await gm.setPrice(web3.utils.toWei('0.1'), { from: DAO });
    const fee = await gm.getFee(1);
    await gm.claim([1], { value: fee, from: user1 });
    // await gm.claim([100], { value: fee, from: user2 });
    await gm.claim([101], { value: fee, from: user3 });
    await time.increase(60 * 60 * 24 * 365);
    // await gm.claimEarned([100], { from: user2 });
    await gm.claimEarned([101], { from: user3 });
  });

  it("First land owned by address[1]", async () => {
    expect(await nft.ownerOf(1)).equal(user1);
  });

  it("placeToken", async () => {
    await expectRevert(salesManager.placeToken(ether("0.5"), 4, 1, false, { from: user2 }), "You're not an owner of this token");
    await expectRevert(salesManager.placeToken(ether("0"), 4, 1, false, { from: user1 }), "Price is too low");
    await expectRevert(salesManager.placeToken(ether("0.5"), 40, 1, false, { from: user1 }), "Too long period of time");
    await expectRevert(salesManager.placeToken(ether("0.5"), 0, 1, false, { from: user1 }), "Time period too short");
    expect(await salesManager.isTokenPlaced(1)).to.be.false;
    await salesManager.placeToken(ether("0.5"), 4, 1, false, { from: user1 });
    expect(await salesManager.isTokenPlaced(1)).to.be.true;
  });

  it("Set royalty", async () => {
    await expectRevert(salesManager.setRoyalty(2500, 1000, { from: DAO }), "Royalty must be less or equal 20%");
    await salesManager.setRoyalty(600, 300, { from: DAO });
    expect(Number(await salesManager.royalty())).to.be.equal(600);
  });

  it("buyLand", async () => {
    await expectRevert(gm.buyLand(1, { from: user2, value: ether("0.4") }), "Not enough funds");
    await expectRevert(gm.buyLand(1, { from: user2, value: ether("0.5") }), "burn amount exceeds balance");
    const fee = await gm.getFee(1);
    await gm.claim([100], { value: fee, from: user2 });
    await time.increase(60 * 60 * 24 * 200);
    await gm.claimEarned([100], { from: user2 });
    await expectRevert(gm.buyLand(1, {from: user2, value: ether("0.5")}), "Token time period ended");
    await salesManager.placeToken(ether("0.5"), 4, 1, { from: user1 });
    expect(await nft.ownerOf(1)).equal(user1);
    const seller = await balance.tracker(user1);
    const buyer = await balance.tracker(user2);
    const royalty = await balance.tracker(user3);
    let sellerFunds = Number(await seller.get());
    let buyerFunds = Number(await buyer.get());
    let royaltyFunds = Number(await royalty.get());
    let buyerClny = Number(await clny.balanceOf(user2)) * 1e-18;
    console.log(sellerFunds * 1e-18, buyerFunds * 1e-18, royaltyFunds * 1e-18);
    await gm.buyLand(1, { from: user2, value: ether("0.6") });
    let sl = Number(await seller.get()) - sellerFunds;
    let br = -(Number(await buyer.get()) - buyerFunds);
    let rl = Number(await royalty.get()) - royaltyFunds;
    expect(sl*1e-18).to.be.greaterThanOrEqual(0.5 - 0.5 * 0.06);
    expect(br*1e-18).to.be.greaterThanOrEqual(0.5);
    expect(rl*1e-18).to.be.greaterThanOrEqual(0.5 * 0.06);
    expect(buyerClny-Number(await clny.balanceOf(user2))*1e-18).to.be.greaterThanOrEqual(2);
    expect(await nft.ownerOf(1)).equal(user2);
  });

  it("removeToken", async function () {
    await expectRevert(salesManager.removeToken(1, { from: user1 }), "You're not an owner of this token");
    await salesManager.placeToken(ether("0.5"), 4, 1, { from: user2 });
    expect(await salesManager.isTokenPlaced(1)).to.be.true;
    await salesManager.removeToken(1, {from: user2});
    expect(await salesManager.isTokenPlaced(1)).to.be.false;
  });

  it("afterTransfer", async function () {
    await salesManager.placeToken(ether("0.5"), 4, 1, { from: user2 });
    expect(await nft.ownerOf(1)).equal(user2);
    await nft.transferFrom(user2, user1, 1, { from: user2 });
    expect(await nft.ownerOf(1)).equal(user1);
    await expectRevert(gm.buyLand(1, {from: user3, value: ether("0.5")}), "Token is not for sale");
    expect(await nft.ownerOf(1)).equal(user1);
  });
});
