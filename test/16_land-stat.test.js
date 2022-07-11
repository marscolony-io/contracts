const { time, ether } = require("openzeppelin-test-helpers");

const LandStats = artifacts.require("LandStats");
const CLNY = artifacts.require("CLNY");
const GM = artifacts.require("GameManager");

contract("LandStats", (accounts) => {
  const [owner, user1] = accounts;

  let clny;
  let gm;
  let ls;

  before(async () => {
    clny = await CLNY.deployed();
    gm = await GM.deployed();
    ls = await LandStats.deployed();

    console.log({
      gm: gm.address,
      clny: clny.address,
      ls: ls.address,
    });

    await gm.setPrice(web3.utils.toWei("0.1"), { from: owner });
    await gm.setClnyPerSecond(
      ether("6000").div(new web3.utils.BN(60 * 60 * 24))
    );
    await gm.claim([99], { value: await gm.getFee(1), from: user1 });

    await time.increase(time.duration.weeks(4)); // should have zero emission as zero tokens
    await gm.claimEarned([99], { from: user1 });
    console.log("FFFFF", (await clny.balanceOf(user1)) * 1e-18);
  });

  it("should return clny stats", async function() {
    console.log("test  ls address", ls.address);
    const stat = await ls.gelClnyStat();
    console.log(stat);
  });
});
