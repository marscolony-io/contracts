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


const MSN = artifacts.require("MissionManager");

contract("MissionsManager", (accounts) => {
    const [DAO, user1, user2] = accounts;
  
    let msn;

    before(async () => {
        msn = await MSN.deployed();
    });
    it("should get account revshare value", async () => {
        expect(Number(await msn.getRevshare(user1))).to.be.equal(20)
    })
    it("should set account revshare", async () => {
        await expectRevert(msn.setAccountRevshare(0, { from: user1 }), "Revshare value is too low, 1 is min")
        await expectRevert(msn.setAccountRevshare(91, { from: user1 }), "Revshare value is too high, 90 is max")
        await msn.setAccountRevshare(25, { from: user1 })
        expect(Number(await msn.getRevshare(user1))).to.be.equal(25)
    })
})