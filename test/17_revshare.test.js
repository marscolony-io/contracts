const { expect } = require("chai")
const { expectRevert } = require('openzeppelin-test-helpers');


const MSN = artifacts.require("MissionManager");
const GM = artifacts.require("GameManager");

contract("MissionsManager", (accounts) => {
    const [DAO, user1, user2] = accounts;
  
    let msn;

    before(async () => {
        msn = await MSN.deployed();
        gm = await GM.deployed();
        await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
        await gm.claim([100], { value: web3.utils.toWei("0.1"), from: user1 });
        await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
        await msn.setAccountRevshare(40, { from: user2 });
    });

    it("should get account revshare value", async () => {
        expect(Number(await msn.getRevshare(user1))).to.be.equal(20)
    });

    it("should set account revshare", async () => {
        await expectRevert(msn.setAccountRevshare(0, { from: user1 }), "Revshare value is too low, 1 is min")
        await expectRevert(msn.setAccountRevshare(100, { from: user1 }), "Revshare value is too high, 99 is max")
        await msn.setAccountRevshare(25, { from: user1 })
        expect(Number(await msn.getRevshare(user1))).to.be.equal(25)
    });

    it("should get revshare for separate lands", async () => {
        const revshares = await msn.getRevshareForLands([100, 200]);
        expect(revshares.map(x => +x)).to.be.eql([25, 40]);
    });
})