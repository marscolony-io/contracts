const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const ORACLE = artifacts.require("Oracle");
const WETH = artifacts.require("Oracle");
const CLNY = artifacts.require("CLNY");
const CollectionManager = artifacts.require("CollectionManager");

contract("Gears", (accounts) => {
  const [DAO, user1, user2, user3] = accounts;

  let oracle;
  let clny;
  let collectionManager;

  before(async () => {
    oracle = await ORACLE.deployed();
    clny = await CLNY.deployed();
    collectionManager = await CollectionManager.deployed();
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
      const wethInUsd = await oracle.wethInUsd();
      // const isValid = await oracle.isRateValid();
      // console.log({ isValid });
      expect(wethInUsd["valid"]).to.be.equal(true);
      expect(parseInt(wethInUsd["rate"])).to.be.equal(500000000000000000000); // back rate
    });

    it("isRateValid invalid case", async () => {
      await time.increase(time.duration.hours(7));
      const wethInUsd = await oracle.wethInUsd();
      expect(wethInUsd["valid"]).to.be.equal(false);
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
      const wethInUsd = await oracle.wethInUsd();
      expect(wethInUsd["valid"]).to.be.equal(false);
    });

    it("can be invoked by relayer", async () => {
      await oracle.actualize("2000000000000000", { from: user2 });
      await oracle.stop({ from: user2 });
      const wethInUsd = await oracle.wethInUsd();
      expect(wethInUsd["valid"]).to.be.equal(false);
    });
  });

  describe("CLNY price", () => {
    it("response with actual clny price", async () => {
      // send some clny to liq pool to get clny/weth price
      await clny.setGameManager(accounts[0], { from: accounts[0] });
      await clny.mint(
        "0xcd818813F038A4d1a27c84d24d74bBC21551FA83",
        new BN("2000000000000000000000"), // same as mocked weth, so rate should be 1/1
        1,
        {
          from: accounts[0],
        }
      );

      // set weth price to $1, expect clny same
      await oracle.actualize("1000000000000000000", { from: user2 });
      const clnyInUsd = await oracle.clnyInUsd();
      // console.log({ clnyInUsd: clnyInUsd["rate"].toString() });
      expect(clnyInUsd["rate"]).to.bignumber.equal(
        new BN("1000000000000000000")
      );
    });
  });

  describe("Lootbox opening price for frontend", () => {
    it("show opening prices for rarities", async () => {
      await collectionManager.setOracleAddress(oracle.address);
      const prices = await collectionManager.getLootboxOpeningPrice();
      // console.log(prices["common"].toString());
      // console.log(prices["rare"].toString());
      // console.log(prices["legendary"].toString());
      expect(prices["common"]).to.bignumber.be.equal(
        new BN("2000000000000000000")
      );
      expect(prices["rare"]).to.bignumber.be.equal(
        new BN("4000000000000000000")
      );
      expect(prices["legendary"]).to.bignumber.be.equal(
        new BN("8000000000000000000")
      );
    });

    it("reverts if price is not valid", async () => {
      await oracle.stop({ from: user2 });

      await truffleAssert.reverts(
        collectionManager.getLootboxOpeningPrice(),
        "oracle price of clny is not valid"
      );
    });
  });
});
