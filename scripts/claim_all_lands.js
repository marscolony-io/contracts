const GM = artifacts.require("GameManager");
const CLNY = artifacts.require("CLNY");

module.exports = async (callback) => {
  try {
    const accounts = await web3.eth.getAccounts();
    const gm = await GM.deployed();
    const clny = await CLNY.deployed();

    await gm.setPrice(web3.utils.toWei("0.1"), { from: accounts[0] });

    // claim all lands to 10 accounts
    // could not mint more than 40 lands in one request, splited this to 100 parts * 21 lands * 10 users = 21000 lands
    for (let part = 0; part < 1; part++) {
      console.log({ part });
      const tasks = [];
      for (let userId = 0; userId < 10; userId++) {
        console.log({ userId });
        const landsIds = Array(21)
          .fill("")
          .map((_, i) => part * 210 + userId * 21 + i + 1);
        tasks.push(
          gm.claim(landsIds, {
            value: web3.utils.toWei("2.1"),
            from: accounts[userId],
          })
        );
      }
      await Promise.all(tasks);
    }

    callback();
  } catch (error) {
    console.log(error);
  }
};
