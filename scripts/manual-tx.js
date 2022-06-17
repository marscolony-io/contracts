const { assert } = require("chai");
const { BN } = require("openzeppelin-test-helpers");

const MC = artifacts.require("MC");

const whitelist = [];

const GM = artifacts.require('GameManager');

module.exports = async (callback) => {
  try {
    const accounts = await web3.eth.getAccounts();
    // const mc_old = await MC.at('0xb5D95034171733F3D636B49e5f4703d7d906b1a4');
    const mc_new = await MC.at('0x3B45B2AEc65A4492B7bd3aAd7d9Fa8f82B79D4d0');

    const gm = await GM.at('0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797');

    // await gm.updatePool('0xCEBaF32BBF205aDB2BcC5d2a5A5DAd91b83Ba424');

    const missed = [11, 2410, 5126, 5276, 5426, 5425, 4066, 3324, 1657, 20890, 3001, 5840, 4671, 20934, 134, 6051, 5116, 2222, 43, 671, 1507, 3306, 2269, 100, 16, 12, 48, 122, 20880, 1826, 146, 1371, 1372, 4092, 13391, 3890, 5976, 88, 120, 2690, 72, 145, 670, 1510, 4950, 7675, 2271, 55, 673, 2546, 2735, 6539, 5121, 20942, 1053, 3333, 2730, 2270, 12601, 3313, 2870, 3802, 67, 1810, 2120, 7231, 147, 4000, 3015, 655, 68, 4521, 5900, 6050, 2251]

    await gm.migrateShares(missed);

    console.log(111);


    const tokens = 
    [ ...await mc_new.allTokensPaginate(0, 1000),
      ...await mc_new.allTokensPaginate(1001, 2000),
      ...await mc_new.allTokensPaginate(2001, 3000),
      ...await mc_new.allTokensPaginate(3001, 4000),
    ].map(o => +o);

    const zeroShares = [];
    for (const token of missed) {
      const landInfo = await gm.landInfo(token);
      console.log(token, +landInfo.share, +landInfo.rewardDebt);
      if (+landInfo.share === 0) {
        zeroShares.push(token);
        console.log(zeroShares.length);
      }
    }

    console.log(zeroShares.join(', '));

    console.log(111);
    callback()

    return;

    // while (tokens.pop() !== 11) {}
    
    let bunch = [];
    while (tokens.length) {
      bunch.push(tokens.pop());
      if (bunch.length >= 100) {
        console.log(bunch);
        await gm.migrateShares(bunch)
        bunch = [];
      }
    }
    console.log(bunch);
    await gm.migrateShares(bunch)
    bunch = [];


    // return;

    // const items = [
    //   452, 453, 454, 455, 456, 457, 458, 459, 463, 464, 465, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 509, 510, 511, 512, 513, 515, 516, 517, 518, 519, 523, 524, 525, 527, 529, 543, 544, 551, 552, 553, 554, 556, 557, 558, 559, 560, 561, 562, 563, 564, 566, 567, 568, 569, 570, 571, 574, 575, 576, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 594, 595, 597, 598, 601, 602, 603, 604, 605, 608, 609, 611, 612, 613, 614, 615, 619, 620, 621, 622, 623, 624, 627, 628, 629, 642, 643, 644, 645, 646, 647, 648, 649, 650, 652, 653, 654, 657, 658, 659, 663, 667, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 686, 687, 688, 689, 691, 692, 693, 694, 695, 696, 697, 698, 699, 701, 702, 703, 704, 705, 708, 709, 710, 711, 712, 713, 715, 716, 718, 719, 720, 721, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731, 732, 734, 735, 736, 737, 738, 739, 740, 741, 742, 743, 744, 745, 746, 747, 748, 749, 751, 752, 753, 754, 755, 756, 757, 758, 760, 761, 764, 765, 766, 767, 768, 769, 771, 772, 773
    // ];

    // const toMint = [
    //   ['0x0Bd22E39c60f45166f08e5F0d876CE4983690eDD', 22],
    //   ['0x568945E5F0FA8409beb2F3a53842ECd2798B62c2', 6],
    //   ['0x08f90C53dc5069975c845707b2963AbeD4323780', 6],
    //   ['0xeBFFEFB7510935E6e20D86e8407AdBc8311954e2', 6],
    //   ['0xA1eB8CBb7971181255Aa93d087D52c99a44E0AFB', 6],
    //   ['0x9a68a60A34E562477cE1c284B6Ce67A03A72ffe6', 3],
    //   ['0xAffa41E9496431fbB96B769bbDb9E0f44D0d8fEA', 6],
    //   ['0xbfF46C3209917eeA2E1DF2F33cA0577D52E1482B', 3],
    //   ['0xb407aACAEEdf1C8c0f65de877aC04267d1aa57c9', 6],
    //   ['0xe80e18Ed98A68bdFa47086F3b673e310aF2b55dA', 16],
    //   ['0xdfCD0a160203b858D228651443B36f927bE6f4CD', 3],
    //   ['0xc2e47b45f525863fCd90425d4246C3E6c409ec9D', 3],
    //   ['0x8E6b56ca2Ef39cCa96048a4E7AC5Db9e8F5A7C23', 13],
    //   ['0x12F2f24F02f550159B0F43E2b2d5D7Af0Bd4f879', 3],
    //   ['0x61D0A5432baa6C5764aB584552D600c2cbAe6427', 3],
    //   ['0xB41e038811c228e5A782b9F2B6f944800fe422ea', 3],
    //   ['0x39B2B3F2199a37cAd05fd72d99be0f0ae6DCB9d7', 13],
    //   ['0x74cA7107fE7AEeCd5a863C1E461D50A3AdC94428', 3],
    //   ['0x38dAEa6f17E4308b0Da9647dB9ca6D84a3A7E195', 13],
    //   ['0xec8022CDE846D33a21FA28896E6e4F89603B3B14', 6],
    //   ['0x85CA40b9A4f2b26755C41a4770C79b0996cA94AE', 6],
    // ];

    // const addrs = [];
    // const ids = [];
    // for (const [address, count] of toMint) {
    //   for (let i = 0; i < count; i++) {
    //     addrs.push(address);
    //     ids.push(items.shift());
    //   }
    // }

    // console.log(addrs);
    // console.log(ids);
    // console.log(addrs.length);
    // console.log(ids.length);

    // {
    //   const adr1 = [];
    //   const ids1 = [];
    //   for (let i = 0; i < 30; i++) {
    //     adr1.push(addrs.pop());
    //     ids1.push(ids.pop());
    //   }
    //   // await mc_new.migrationMint(adr1, ids1, false);
    //   // await gm.migrateShares(ids1);
    // }
    // // return;
    // {
    //   const adr1 = [];
    //   const ids1 = [];
    //   for (let i = 30; i < 60; i++) {
    //     adr1.push(addrs.pop());
    //     ids1.push(ids.pop());
    //   }
    //   // await mc_new.migrationMint(adr1, ids1, false);
    //   // await gm.migrateShares(ids1);
    // }
    // console.log(111);
    // {
    //   const adr1 = [];
    //   const ids1 = [];
    //   for (let i = 60; i < 90; i++) {
    //     adr1.push(addrs.pop());
    //     ids1.push(ids.pop());
    //   }
    //   // await mc_new.migrationMint(adr1, ids1, false);
    //   // await gm.migrateShares(ids1);
    // }
    // console.log(111);
    // {
    //   const adr1 = [];
    //   const ids1 = [];
    //   for (let i = 90; i < 120; i++) {
    //     adr1.push(addrs.pop());
    //     ids1.push(ids.pop());
    //   }
    //   // await mc_new.migrationMint(adr1, ids1, false);
    //   // await gm.migrateShares(ids1);
    // }
    // console.log(111);
    // {
    //   const adr1 = [];
    //   const ids1 = [];
    //   for (let i = 120; i < 149; i++) {
    //     adr1.push(addrs.pop());
    //     ids1.push(ids.pop());
    //   }
    //   console.log(adr1, ids1);
    //   await mc_new.migrationMint(adr1, ids1, false);
    //   await gm.migrateShares(ids1);
    // }
    // console.log(111);

    // const free = [];
    // for (let i = 452; i <= 21000; i++) {
    //   try {
    //     const item = await mc_new.ownerOf(i);
    //   } catch (error) {
    //     if (error.message.includes('nonexistent')) {
    //       free.push(i)
    //       if (free.length > 200) {
    //         break;
    //       }
    //       console.log(i)
    //     }
    //   }
    // }
    // console.log(free.join(', '));
    


    // await gm.setTotalShareFromTotalSupply();
    // console.log(+new BN(web3.utils.toWei('28172.4845996')).div(new BN('86400')) * 1e-18);
    // return;

    // await gm.setClnyPerSecond(new BN(web3.utils.toWei('28172.4845996')).div(new BN('86400')));

    // await gm.setTreasuryAndLiquidity();

    const tres = await gm.treasury();
    const liq = await gm.liquidity();

    const lastRewardTime = +await gm.lastRewardTime();
    const accColonyPerShare = +await gm.accColonyPerShare();
    const clnyPerSecond = +await gm.clnyPerSecond();
    const totalShare = +await gm.totalShare();


    console.log({
      lastRewardTime,
      accColonyPerShare,
      clnyPerSecond,
      totalShare,
      tres,
      liq,
    });

    // for (let i = 20965; i <= 21000; i += 1) {
    //   let errored = false;
    //   let owner1;
    //   let owner2;
    //   try {
    //     owner1 = await mc_new.ownerOf(i);
    //   } catch (error) {
    //     if (error.message.includes('execution reverted: ERC721: owner query for nonexistent token')) {
    //       errored = true;
    //     } else {
    //       throw error;
    //     }
    //   }
    //   try {
    //     owner2 = await mc_old.ownerOf(i);
    //     if (errored) {
    //       console.log('ERRORED');
    //       throw '';
    //     }
    //   } catch (error) {
    //     if (error.message.includes('execution reverted: ERC721: owner query for nonexistent token')) {
    //       if (!errored) {
    //         console.log('ERRORED');
    //         throw '';
    //       }
    //     } else {
    //       throw error;
    //     }
    //   }
    //   assert(owner1 == owner2, owner1 + ' error');
    //   if (owner1) console.log(i, owner1);
    // }

    callback();
  } catch (error) {
    console.log(error);
  }
};