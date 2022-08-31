const ORACLE = artifacts.require("Oracle");
const WETH = artifacts.require("WETH");
const CLNY = artifacts.require("CLNY");

module.exports = async (deployer, network) => {
  let weth;
  let wclny;
  let lpool;

  if (network === "development") {
    lpool = "0xcd818813F038A4d1a27c84d24d74bBC21551FA83";
    await deployer.deploy(WETH);
    weth = (await WETH.deployed()).address;
    wclny = (await CLNY.deployed()).address;
  } else if ((network = "harmony")) {
    weth = "0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a";
    wclny = "0x0D625029E21540aBdfAFa3BFC6FD44fB4e0A66d0";
    lpool = "0xcd818813F038A4d1a27c84d24d74bBC21551FA83";
  }

  await deployer.deploy(ORACLE, weth, wclny, lpool);
};
