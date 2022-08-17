const { assert, expect } = require("chai");
const truffleAssert = require("truffle-assertions");
const { time, BN, expectRevert } = require("openzeppelin-test-helpers");

const GameManagerFixed = artifacts.require("GameManagerFixed");
const LBX = artifacts.require("Lootboxes");
const AVATARS = artifacts.require("MartianColonists");
const CM = artifacts.require("CollectionManager");
const MC = artifacts.require("MC");

contract("Lootboxes", (accounts) => {
  const [DAO, user1, user2] = accounts;

  let gm;
  let lbx;
  let avatars;
  let cm;
  let mc;

  const baseUri = "baseuri.test/";

  let nextToMint = 1;

  before(async () => {
    gm = await GameManagerFixed.deployed();
    lbx = await LBX.deployed();
    avatars = await AVATARS.deployed();
    cm = await CM.deployed();
    mc = await MC.deployed();

    await cm.setMaxTokenId(5);
    await gm.setPrice(web3.utils.toWei("0.1"), { from: DAO });
    await gm.claim([1], { value: web3.utils.toWei("0.1"), from: user1 });
    await gm.claim([200], { value: web3.utils.toWei("0.1"), from: user2 });
    await time.increase(60 * 60 * 24 * 365);
    await gm.claimEarned([1], { from: user1 });
    await gm.claimEarned([200], { from: user2 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
    await gm.mintAvatar({ from: user1 });
  });

  describe("Mint", function() {
    it("Reverts if mint called not by mission manager", async () => {
      await truffleAssert.reverts(lbx.mint(user2, 1), "only game manager");
    });

    it("Mints if called by mission manager", async () => {
      await lbx.setGameManager(DAO);
      await lbx.setBaseURI(baseUri);
      await lbx.mint(user1, 0);
      nextToMint++;
      await lbx.mint(user2, 1);
      nextToMint++;
      const supplyAfterMint = await lbx.totalSupply();
      expect(Number(supplyAfterMint.toString())).to.be.equal(2);
      const ownerOf1 = await lbx.ownerOf(1);
      const ownerOf2 = await lbx.ownerOf(2);
      expect(ownerOf1).to.be.equal(user1);
      expect(ownerOf2).to.be.equal(user2);
    });
  });

  describe("Rarity", function() {
    it("Returns correct rarity from struct", async () => {
      await lbx.mint(user1, 2);
      const rarity1 = await lbx.rarities(nextToMint);
      nextToMint++;
      await lbx.mint(user1, 1);
      const rarity2 = await lbx.rarities(nextToMint);
      nextToMint++;
      await lbx.mint(user1, 0);
      const rarity3 = await lbx.rarities(nextToMint);
      nextToMint++;

      expect(rarity1.toString()).to.be.equal("2");
      expect(rarity2.toString()).to.be.equal("1");
      expect(rarity3.toString()).to.be.equal("0");
    });
  });

  describe("TokenURI", function() {
    it("Returns correct URI with rarity part", async () => {
      const uri1 = await lbx.tokenURI(1);
      const uri2 = await lbx.tokenURI(2);
      const [base1, id1, rarity1] = uri1.split("/");
      expect(baseUri.startsWith(base1)).to.be.true;
      expect(id1).to.be.equal("1");
      expect(rarity1).to.be.equal("0");

      const [base2, id2, rarity2] = uri2.split("/");
      expect(baseUri.startsWith(base2)).to.be.true;
      expect(id2).to.be.equal("2");
      expect(rarity2).to.be.equal("1");
    });
  });

  describe("Burn", function() {
    it("Reverts if burn called not by game manager", async () => {
      await lbx.setGameManager(user1);
      await truffleAssert.reverts(lbx.burn(1), "only game manager");
    });

    it("Burn lootbox", async () => {
      await lbx.setGameManager(DAO);
      expect(await lbx.totalSupply()).to.be.a.bignumber.that.equals(
        new BN("5")
      );
      await lbx.burn(1);
      expect(await lbx.totalSupply()).to.be.a.bignumber.that.equals(
        new BN("4")
      );
    });
  });

  describe("Finish Mission", function() {
    const signer = {
      privateKey:
        "4028ea385a848c51ff76c0d968305e273d415335ccd06854630a8465b67a9eef",
      address: "0x5a636D26070A8a132E4731743CA12964CBB1950b",
    };

    it("Set message sender to backend sender", async () => {
      await gm.setBackendSigner(signer.address);
    });

    it("Mint avatar owner lootbox with common rarity ", async () => {
      await lbx.setGameManager(gm.address);
      const totalSupplyBefore = await lbx.totalSupply();

      const rarity = "01";

      const message = `1111111111111111111111111111111100002000022100010000000${rarity}1111111111111111111111`;
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      const ownerOfAvatar = await avatars.ownerOf(1);

      await gm.finishMission(message, signature.v, signature.r, signature.s);

      const totalSupplyAfter = await lbx.totalSupply();
      expect((totalSupplyAfter - totalSupplyBefore).toString()).to.be.equal(
        "1"
      );

      const lootBoxOwner = await lbx.ownerOf(nextToMint);
      expect(lootBoxOwner).to.be.equal(ownerOfAvatar);

      const lootboxRarity = await lbx.rarities(nextToMint);
      // console.log({ lootboxRarity });
      expect(lootboxRarity.toString()).to.be.equal("0");
      nextToMint++;
    });

    it("Mint avatar owner lootbox with legendary rarity ", async () => {
      await lbx.setGameManager(gm.address);

      const rarity = "03";

      const message = `1111111111111111111111111111111100002000022100010000000${rarity}1111111111111111111111`;
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      await gm.finishMission(message, signature.v, signature.r, signature.s);

      const lootboxRarity = await lbx.rarities(nextToMint);
      expect(lootboxRarity.toString()).to.be.equal("2");
      nextToMint++;
    });

    it("Doesn't mint avatar for land owner", async () => {
      const totalSupplyBefore = await lbx.totalSupply();
      const rarity = "00";
      const message = `1111111111111111111111111111111100002000020000110000000${rarity}1111111111111111111111`;
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      await gm.finishMission(message, signature.v, signature.r, signature.s);

      const totalSupplyAfter = await lbx.totalSupply();

      expect(totalSupplyAfter - totalSupplyBefore).to.be.equal(0);
    });

    it("Increases lootBoxesToMint common field for land owner", async () => {
      const rarity = "23";
      const message = `1111111111111111111111111111111100002000020020010000000${rarity}1111111111111111111111`;
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      await gm.finishMission(message, signature.v, signature.r, signature.s, {
        from: user2,
      });

      const landOwner = await mc.ownerOf(200);

      const lootBoxesToMintAfter = await gm.lootBoxesToMint(landOwner);

      expect(lootBoxesToMintAfter.common.toString()).to.be.equal("1");
    });

    it("Increases lootBoxesToMint legendary field for land owner", async () => {
      const rarity = "25";
      const message = `1111111111111111111111111111111100002000020020010000000${rarity}1111111111111111111111`;
      const signature = await web3.eth.accounts.sign(
        message,
        signer.privateKey
      );

      await gm.finishMission(message, signature.v, signature.r, signature.s, {
        from: user2,
      });

      const landOwner = await mc.ownerOf(200);

      const lootBoxesToMintAfter = await gm.lootBoxesToMint(landOwner);

      expect(lootBoxesToMintAfter.legendary.toString()).to.be.equal("1");
    });

    it("Mint legendary first", async () => {
      await gm.mintLootbox({ from: user2 });
      const lootBoxOwner = await lbx.ownerOf(nextToMint);

      const lootBoxesToMintAfter = await gm.lootBoxesToMint(lootBoxOwner);
      expect(lootBoxesToMintAfter.legendary.toString()).to.be.equal("0");

      const rarity = await lbx.rarities(nextToMint);
      expect(rarity.toString()).to.be.equal("2");
      nextToMint++;
    });

    it("Mint common last", async () => {
      await gm.mintLootbox({ from: user2 });
      const lootBoxOwner = await lbx.ownerOf(nextToMint);

      const lootBoxesToMintAfter = await gm.lootBoxesToMint(lootBoxOwner);
      expect(lootBoxesToMintAfter.common.toString()).to.be.equal("0");

      const rarity = await lbx.rarities(nextToMint);
      expect(rarity.toString()).to.be.equal("0");
      nextToMint++;
    });

    it("Reverts if no lootboxes to mint more", async () => {
      const tx = gm.mintLootbox({ from: user2 });
      await truffleAssert.reverts(tx, "you cannot mint lootbox");
    });
  });

  describe("Last owned token URI", async () => {
    it("Checks the function", async () => {
      await lbx.setGameManager(DAO);
      await lbx.mint(user1, 0);
      nextToMint++;
      const balanceOf = +(await lbx.balanceOf(user1));
      const token = +(await lbx.tokenOfOwnerByIndex(user1, balanceOf - 1));
      const lastUriClassic = await lbx.tokenURI(token);
      await expectRevert(
        lbx.lastOwnedTokenURI(),
        "User hasn't minted any token"
      );
      const lastUri = await lbx.lastOwnedTokenURI({ from: user1 });
      expect(lastUri).to.be.equal(lastUriClassic);
      expect(lastUri).to.be.equal(baseUri + "10/0/");
    });
  });

  describe("All My Tokens Paginate", async () => {
    it("Checks the function", async () => {
      const twoFirstTokens = await lbx.allMyTokensPaginate(0, 1, {
        from: user1,
      });
      expect(twoFirstTokens[0].map((value) => +value)).to.be.eql([5, 3]);
      expect(twoFirstTokens[1].map((value) => +value)).to.be.eql([0, 2]); // rarities
      const upTo100FirstTokens = await lbx.allMyTokensPaginate(0, 99, {
        from: user1,
      });
      expect(upTo100FirstTokens[0].map((value) => +value)).to.be.eql([
        5,
        3,
        4,
        6,
        7,
        10,
      ]);
      expect(upTo100FirstTokens[1].map((value) => +value)).to.be.eql([
        0,
        2,
        1,
        0,
        2,
        0,
      ]);
    });
  });

  describe("GameManager burns a token", async () => {
    it("Not a GameManager can't burn", async () => {
      await expectRevert(lbx.burn(5, { from: user1 }), "only game manager");
    });
    it("GameManager can burn", async () => {
      // DAO is GM
      await lbx.burn(5, { from: DAO });
      await expectRevert(
        lbx.ownerOf(5),
        "ERC721: owner query for nonexistent token"
      );
    });
  });
});
