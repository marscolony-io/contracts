const GM = artifacts.require('GameManager');
const MC = artifacts.require('MC');

module.exports = async (callback) => {
  try {
      
    const [DAO] = await web3.eth.getAccounts();
    let _GM;
    let _MC;
    
    _GM = await GM.at('0x0Dd5dDaC089613F736e89F81E16361b09c7d53C6'); // harmony
    _MC = await MC.at(await _GM.MCAddress());

    const allTokenIds = [];

    for (let i = 0; i < 210; i++) {
      const tokens = (await _MC.allTokensPaginate(i * 100, (i + 1) * 100 - 1)).map(z => +z);
      allTokenIds.push(...tokens);
      if (tokens.length === 0) {
        break;
      }
    }

    console.log(allTokenIds);
  
    let tokenIds = [];
    for (let i = 0; i < allTokenIds.length; i++) {
      tokenIds.push(allTokenIds[i])
      if ((i + 1) % 1000 == 0 || i === allTokenIds.length - 1) {
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