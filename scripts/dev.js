const { time } = require("openzeppelin-test-helpers");
const GM = artifacts.require("GameManagerShares");
const MC = artifacts.require("MC");
const MSN = artifacts.require("MissionManager");
const MCL = artifacts.require("MartianColonists");

module.exports = async (callback) => {
  try {
    const mc = await MC.at('0xBF5C3027992690d752be3e764a4B61Fc6910A5c0');

    const ts = +await mc.totalSupply();

    const tokenIds = [];
    const owners = [];

    for (let i = 0; i < ts; i++) {
      const tokenId = +await mc.tokenByIndex(i);
      const owner = await mc.ownerOf(tokenId);
      tokenIds.push(tokenId);
      owners.push(owner);
      console.log(i, ts, tokenId, owner);
    }

    console.log('[' + owners.map(x => "'" + x + "'").join(', ') + ']');
    console.log('[' + tokenIds.map(x => "" + x + "").join(', ') + ']');

    callback();
  } catch (error) {
    console.log(error);
    callback();
  }
};
