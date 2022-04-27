const GM = artifacts.require("GameManager");
const MC = artifacts.require("MC");
const CLNY = artifacts.require("CLNY");

module.exports = async (callback) => {
  try {
    const accounts = await web3.eth.getAccounts();
    const gm = await GM.deployed();
    const mc = await MC.deployed();

    const clny = await CLNY.deployed();

    const gmm = await clny.GameManager();
    console.log({ gmm });

    await clny.setGameManager(accounts[0], { from: accounts[0] });
    await clny.mint(accounts[0], "500000000000000000000", {
      from: accounts[0],
    });
    await clny.setGameManager(gmm, {
      from: accounts[0],
    });

    const userBalance = await clny.balanceOf(accounts[0]);
    console.log({ userBalance: userBalance.toString() });

    await gm.buildAndPlaceBaseStation(1, 5, 7, { from: accounts[0] });

    callback();
  } catch (error) {
    console.log(error);
  }
};
