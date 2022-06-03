const MC = artifacts.require("MC");

const whitelist = [];

const GM = artifacts.require('GameManager');

module.exports = async (callback) => {
  try {
    const accounts = await web3.eth.getAccounts();
    const gm = await GM.at('0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797');

    console.log(whitelist.length);

    for (let i = 0; i < 2917; i += 500) {
      const all = [];
      for (let j = 0; j < 500; j++) {
        if (0 === whitelist.length) {
          break;
        }
        all.push(whitelist.shift());
      }
      console.log(all.length)
      try {
        await gm.addToAllowlist(all, { from: accounts[1] });
      } catch {
        console.log('retry');
        try {
          await gm.addToAllowlist(all, { from: accounts[1] });
        } catch {
          console.log('retry 2');
          await gm.addToAllowlist(all, { from: accounts[1] });
        }
      }
    }

    callback();
  } catch (error) {
    console.log(error);
  }
};