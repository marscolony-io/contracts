const CM = artifacts.require("CollectionManager");

module.exports = async (callback) => {
  try {
    // const mc = await MC.at('0x0bC0cdFDd36fc411C83221A348230Da5D3DfA89e'); // '0x3B45B2AEc65A4492B7bd3aAd7d9Fa8f82B79D4d0');
    // const mcl = await MCL.at('0xFDCC01E0Fe5D3Fb11B922447093EE6862685616c');
    const cm = await CM.at('0xE29163dE0dD747f55d5D2287d5FE874F65C9Fa8E'); // polygon

    const OWNERS = 
``.split('\n');

  let i = 0;
  for (const owner of OWNERS) {
    console.log(++i);
    if (i < 0) {
      continue;
    }
    console.log('start', owner);
    await cm.dropAvatars(owner, 1);
    console.log('end', owner);
  }

    callback();
  } catch (error) {
    console.log(error);
    callback();
  }
};
