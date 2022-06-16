const GM = artifacts.require('GameManager');

module.exports = async (callback) => {
  try {
      
    const [DAO] = await web3.eth.getAccounts();
    let _GM;
    
    _GM = await GM.deployed();
//   _GM = await GM.at('0xc65F8BA708814653EDdCe0e9f75827fe309E29aD'); // hartest
//   _GM = await GM.at('0x0D112a449D23961d03E906572D8ce861C441D6c3'); // harmain
  
    let tokenIds = []
    const tasks = []
    for (let i = 1; i<=21000; i++) {
        tokenIds.push(i)
        if (i%1000 == 0) {
            console.log(i)
            tasks.push(_GM.fixEarnings(tokenIds, { from: DAO }));
            tokenIds = []
        }
    }
    await Promise.all(tasks)
    callback();
  } catch (error) {
      console.log(error)
  }
};