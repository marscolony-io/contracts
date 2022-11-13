const { time } = require("openzeppelin-test-helpers");
const GM = artifacts.require("GameManagerShares");
const MC = artifacts.require("MC");
const MSN = artifacts.require("MissionManager");
const MCL = artifacts.require("MartianColonists");
const fs = require('fs');

module.exports = async (callback) => {
  try {
    const mc = await MC.at('0x76F8089064f58586471f38824da290913E6a5454');

    const ts = +await mc.totalSupply();

    const tokenIds = [];
    const owners = [];
    const ownerSet = new Set();

    for (let i = 0; i < ts; i++) {
      let tokenId;
      let owner;
      try {
        // tokenId = +await mc.tokenByIndex(i);
        owner = await mc.ownerOf(i + 1);
      } catch (error) {
        console.error(error);
        try {
          // tokenId = +await mc.tokenByIndex(i);
          owner = await mc.ownerOf(i + 1);
        } catch (error) {
          console.error(error);
          owner = await mc.ownerOf(i + 1);
        }
      }
      tokenIds.push(tokenId);
      owners.push(owner);
      ownerSet.add(owner);
      console.log(i, ts, tokenId, owner);
    }

    // console.log('[' + owners.map(x => "'" + x + "'").join(', ') + ']');
    console.log(Array.from(ownerSet).map(x => "" + x + "").join('\n'));
    // console.log('[' + tokenIds.map(x => "" + x + "").join(', ') + ']');
    fs.writeFileSync('avatarOwners.txt', Array.from(ownerSet).map(x => "" + x + "").join('\n'), 'utf-8');
    callback();
  } catch (error) {
    console.log(error);
    callback();
  }
};
