const GM = artifacts.require("GameManager");
const CM = artifacts.require("CollectionManager");
const CLNY = artifacts.require("CLNY");

module.exports = async (callback) => {
  try {
    const accounts = await web3.eth.getAccounts();
    const sett = new Set();
    const am = await AM.at("0xCc55065afd013CF06f989448cf724fEC4fF29626");
    for (let i = 1; i <= 21000 - 100; i = i + 100) {
      const avis = [];
      for (let j = 0; j < 100; j++) {
        avis.push(i + j);
      }
      const xps = await am.getXP(avis);
      for (const xp of xps) {
        sett.add(+xp);
      }
      console.log(xps.map((i) => (+i).toString().padStart(4, "0")).join(" "));
    }
    console.log([...sett].sort((a, b) => b - a));
    callback();
  } catch (error) {
    console.log(error);
  }
};
