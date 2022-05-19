const NFT = artifacts.require("MC");
const SalesManager = artifacts.require("SalesManager")
const { expect } = require("chai")
const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  ether,
  time,
  balance
} = require('@openzeppelin/test-helpers');

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */

// Написать тест выставить токен на продажу и отправить его на другой аккаунт, токен не должен покупаться
// В afterTranfser снимать с продажи (mapping)
// Тесты на весь на контракт
// {from: address, value: ether("0.5")}
// Проверить работу покупки

contract("MC", function (accounts) {
    const [DAO, user1, user2, user3] = accounts
    let nft;
    let salesManager;
    before(async function () {
        nft = await NFT.deployed();
        salesManager = await SalesManager.deployed();
        await nft.setGameManager(DAO, { from: DAO });
    });
    const GM = DAO
    it("should mint to address[1]", async function () {
        await nft.mint(user1, 1, {from: GM});
        expect(await nft.ownerOf(1)).equal(user1)
    });
    it("placeToken", async function () {
        await nft.approve(salesManager.address, 1, {from: user1})
        await expectRevert(salesManager.placeToken(ether("0.5"), 4, 1, {from: user2}), "You're not an owner of this token")
        await expectRevert(salesManager.placeToken(ether("0"), 4, 1, {from: user1}), "Price is too low")
        await expectRevert(salesManager.placeToken(ether("0.5"), 40, 1, {from: user1}), "Too long period of time")
        await expectRevert(salesManager.placeToken(ether("0.5"), 0, 1, {from: user1}), "Time period too short")
        expect(await salesManager.isTokenPlaced(1)).to.be.false
        await salesManager.placeToken(ether("0.5"), 4, 1, {from: user1})
        expect(await salesManager.isTokenPlaced(1)).to.be.true
    });
    it("buyToken", async function () {
        await nft.approve(salesManager.address, 1, {from: user1})
        await expectRevert(salesManager.buyToken(1, {from: user2, value: ether("0.4")}), "Not enough funds")
        await time.increase(5*24*60*60)
        await expectRevert(salesManager.buyToken(1, {from: user2, value: ether("0.5")}), "Token time period ended")
        await salesManager.placeToken(ether("0.5"), 4, 1, {from: user1})
        expect(await nft.ownerOf(1)).equal(user1)
        const seller = await balance.tracker(user1)
        const buyer = await balance.tracker(user2)
        let sellerFunds = Number(await seller.get())
        let buyerFunds = Number(await buyer.get())
        console.log(sellerFunds, buyerFunds)
        await salesManager.buyToken(1, {from: user2, value: ether("0.6")})
        // let sl = Number(await seller.delta())
        // let br = -Number(await buyer.delta())
        let sl = Number(await seller.get())-sellerFunds
        let br = -(Number(await buyer.get())-buyerFunds)
        // console.log(sl*1e-18, br*1e-18)
        expect(sl*1e-18).to.be.greaterThanOrEqual(0.5)
        expect(br*1e-18).to.be.greaterThanOrEqual(0.5)
        // expect(sl>=ether("0.5")).to.be.true
        // expect(br>=ether("0.5")).to.be.true
        expect(await nft.ownerOf(1)).equal(user2)
    })
    it("removeToken", async function () {
        await nft.approve(salesManager.address, 1, {from: user2})
        await expectRevert(salesManager.removeToken(1, {from: user1}), "You're not an owner of this token")
        await salesManager.placeToken(ether("0.5"), 4, 1, {from: user2})
        expect(await salesManager.isTokenPlaced(1)).to.be.true
        await salesManager.removeToken(1, {from: user2})
        expect(await salesManager.isTokenPlaced(1)).to.be.false
    })
    it("afterTransfer", async function () {
        await nft.approve(salesManager.address, 1, {from: user2})
        await salesManager.placeToken(ether("0.5"), 4, 1, {from: user2})
        expect(await nft.ownerOf(1)).equal(user2)
        await nft.transferFrom(user2, user1, 1, {from: user2})
        expect(await nft.ownerOf(1)).equal(user1)
        await expectRevert(salesManager.buyToken(1, {from: user3, value: ether("0.5")}), "Token is not for sale")
        expect(await nft.ownerOf(1)).equal(user1)
    })
});
