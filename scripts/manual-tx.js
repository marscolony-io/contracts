const MC = artifacts.require("MC");

module.exports = async (callback) => {
  try {
    const accounts = await web3.eth.getAccounts();

    callback();
  } catch (error) {
    console.log(error);
  }
};