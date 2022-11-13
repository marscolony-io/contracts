const { time } = require("openzeppelin-test-helpers");
const { web3 } = require("openzeppelin-test-helpers/src/setup");
const GM = artifacts.require("GameManagerShares");
const MC = artifacts.require("MC");
const MSN = artifacts.require("MissionManager");
const MCL = artifacts.require("MartianColonists");
const CM = artifacts.require("CollectionManager");

const MINTED = 29569512; // block no

module.exports = async (callback) => {
  try {
    // const mc = await MC.at('0x0bC0cdFDd36fc411C83221A348230Da5D3DfA89e'); // '0x3B45B2AEc65A4492B7bd3aAd7d9Fa8f82B79D4d0');
    // const mcl = await MCL.at('0xFDCC01E0Fe5D3Fb11B922447093EE6862685616c');
    const cm = await CM.at('0xE29163dE0dD747f55d5D2287d5FE874F65C9Fa8E');

    const OWNERS = [];


    // const BUYERS = [];
    
    let i = 0;
    for (const owner of OWNERS) {
      console.log(owner, i++, 'start');
      if (i <= 235) continue;
      await cm.mintSpecialHarmonyGear(owner);
      console.log(owner, i, 'end');
    }
    // const owners = new Set();
    // for (const buyer of BUYERS) {
    //   const mcBalance = +await mc.balanceOf(buyer);
    //   const mclBalance = +await mcl.balanceOf(buyer);
    //   console.log(buyer, mcBalance, mclBalance);
    //   if (mcBalance + mclBalance > 0) {
    //     owners.add(buyer);
    //   }
    //   await new Promise(rs => setTimeout(rs, 300));
    // }
    // console.log(Array.from(owners).map(i => `'${i}'`).join(', '));

    // const maxBlock = 34871185; // +await web3.eth.getBlockNumber();
    // let blockFrom = MINTED;
    // const buyers = new Set();
    // console.log({ maxBlock });
    // while (blockFrom < maxBlock) {
    //   const events = await mc.getPastEvents('Transfer', {
    //     fromBlock: blockFrom,
    //     toBlock: blockFrom + 10_000
    //   });
    //   for (const event of events) {
    //     if (event.args.from === '0x0000000000000000000000000000000000000000') {
    //       // minted
    //       // console.log(event.args.to);
    //       buyers.add(event.args.to);
    //     }
    //   }
    //   blockFrom = blockFrom + 10_000;
    //   console.log(`Block ${blockFrom} of ${maxBlock}: ${buyers.size} in set`);
    // }

    // console.log(Array.from(buyers).map(i => `'${i}'`).join(', '));

    callback();
  } catch (error) {
    console.log(error);
    callback();
  }
};
