const GM = artifacts.require("GameManager");
const AM = artifacts.require("AvatarManager");
const CLNY = artifacts.require("CLNY");

module.exports = async (callback) => {
  try {
    const accounts = await web3.eth.getAccounts();
    let count = 0;
    const gm = await GM.at('0x0D112a449D23961d03E906572D8ce861C441D6c3');
    for (let i = 1; i <= 21000; i = i + 300) {
        const data = [];
        for (let j = 0; j < 300; j++) {
            data.push(i + j);
        }
      const data_ = await gm.getAttributesMany(data);
      for (const item of data_) {
        count += Boolean(+item.baseStation) + Boolean(+item.transport) + Boolean(+item.robotAssembly) + Boolean(+item.powerProduction);
      }
      console.log(i, count, Math.floor(count / i * 100_00));
    }
    callback();
  } catch (error) {
    console.log(error);
  }
};
