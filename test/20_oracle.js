const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const ORACLE = artifacts.require("Oracle");

contract("Gears", (accounts) => {
  const [DAO, user1, user2, user3] = accounts;

  let oracle;

  before(async () => {
    oracle = await ORACLE.deployed();
  });

  describe("Relayers", function() {
    it("Can not add relayer by not owner", async () => {
      await truffleAssert.reverts(
        oracle.addRelayer(user1, { from: user1 }),
        "Ownable: caller is not the owner"
      );
    });

    it("Add relayer", async () => {
      await oracle.addRelayer(user1);
      const relayer = await oracle.relayers(0);
      console.log({ relayers: relayer.toString() });
      expect(relayer).to.be.equal(user1);
    });

    it("Can not add added relayer", async () => {
      await truffleAssert.reverts(
        oracle.addRelayer(user1),
        "relayer added already"
      );
    });

    it("Add second relayer", async () => {
      await oracle.addRelayer(user2);
      const relayer = await oracle.relayers(1);
      console.log({ relayers: relayer.toString() });
      expect(relayer).to.be.equal(user2);
    });

    it("Can not delete relayer by not owner", async () => {
      await truffleAssert.reverts(
        oracle.deleteRelayer(user1, { from: user1 }),
        "Ownable: caller is not the owner"
      );
    });

    it("delete first relayer", async () => {
      await oracle.deleteRelayer(user1);
      const relayer = await oracle.relayers(0);
      console.log({ relayers: relayer.toString() });
      expect(relayer).to.be.equal("0x0000000000000000000000000000000000000000");
    });

    it("add relayer in empty slot", async () => {
      await oracle.addRelayer(user3);
      const relayer = await oracle.relayers(0);
      console.log({ relayers: relayer.toString() });
      expect(relayer).to.be.equal(user3);
    });

    it("can not delete deleted relayer", async () => {
      await truffleAssert.reverts(
        oracle.deleteRelayer(user1),
        "this address is not in relayers"
      );
    });
  });

  describe("Oracle functions", function() {
    it("Can not call actualize if not relayer", async () => {
      await truffleAssert.reverts(
        oracle.deleteRelayer(user1),
        "this address is not in relayers"
      );
    });

    it("Actualize", async () => {
      await oracle.actualize("2000000000000000", { from: user2 });
      const oneInUsd = await oracle.oneInUsd();
      const isValid = await oracle.isRateValid();
      console.log({ isValid });
      expect(oneInUsd["valid"]).to.be.equal(true);
      expect(parseInt(oneInUsd["rate"])).to.be.equal(2000000000000000);
    });

    it("isRateValid invalid case", async () => {
      await time.increase(time.duration.hours(7));
      const oneInUsd = await oracle.oneInUsd();
      expect(oneInUsd["valid"]).to.be.equal(false);
    });
  });

  describe("Stop function", () => {
    it("can not be invoked by not owner/relayer", async () => {
      await truffleAssert.reverts(
        oracle.stop({ from: user1 }),
        "neither relayer nor owner"
      );
    });

    it("can be invoked by owner", async () => {
      await oracle.actualize("2000000000000000", { from: user2 });
      await oracle.stop({ from: DAO });
      const oneInUsd = await oracle.oneInUsd();
      expect(oneInUsd["valid"]).to.be.equal(false);
    });

    it("can be invoked by relayer", async () => {
      await oracle.actualize("2000000000000000", { from: user2 });
      await oracle.stop({ from: user2 });
      const oneInUsd = await oracle.oneInUsd();
      expect(oneInUsd["valid"]).to.be.equal(false);
    });
  });
});
