const GM = artifacts.require('GameManager');

module.exports = async (callback) => {
  try {
      
    const [DAO] = await web3.eth.getAccounts();
    let _GM;
    
    // DO NOT DO ON NETWORKS WITHOUT SOLDOUT (fuji)
    _GM = await GM.at('0x0D112a449D23961d03E906572D8ce861C441D6c3'); // harmony

    await _GM.fixEarnings([1933], { from: DAO });

    callback();
    return;
  
    let tokenIds = []
    const tasks = []
    for (let i = 1; i <= 21000; i++) {
      tokenIds.push(i)
      if (i % 1000 == 0) {
        console.log(i)
        await _GM.fixEarnings(tokenIds, { from: DAO });
        tokenIds = []
      }
    }
    callback();
  } catch (error) {
      console.log(error)
  }
};