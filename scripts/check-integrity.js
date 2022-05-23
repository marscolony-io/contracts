const { assert, expect } = require("chai");

const GM = artifacts.require("GameManager");
const MC = artifacts.require("MC");
const CLNY = artifacts.require("CLNY");
const AM = artifacts.require("AvatarManager");
const MCL = artifacts.require("MartianColonists");
const MM = artifacts.require("MissionManager");

const MAXIM = Boolean(process.env.MAXIM);

const CONTRACTS = {
  harmain: {
    GAME_MANAGER: '0x0D112a449D23961d03E906572D8ce861C441D6c3',
    MC_ERC721: '0x0bC0cdFDd36fc411C83221A348230Da5D3DfA89e',
    CLNY_ERC20: '0x0D625029E21540aBdfAFa3BFC6FD44fB4e0A66d0',
    AVATAR_MANAGER: '0xCc55065afd013CF06f989448cf724fEC4fF29626',
    MARTIAN_COLONISTS_ERC721: '0xFDCC01E0Fe5D3Fb11B922447093EE6862685616c',
    MISSION_MANAGER: '0x0Ef27447c72Fc9809864E1aa3998B76B61c20a8A', // TODO
    OWNER: '0x3A47a5be317DCF439F91D0A45716B64547F21bc1',
    BACKEND_SIGNER: '0xb00b24E974834492A26b34ABCA26b952F1aB35d5',
  },
  hartest: {
    GAME_MANAGER: MAXIM ? '' : '0xc65F8BA708814653EDdCe0e9f75827fe309E29aD',
    MC_ERC721: MAXIM ? '' : '0xc268D8b64ce7DB6Eb8C29562Ae538005Fded299A',
    CLNY_ERC20: MAXIM ? '' : '0x6b1a8FED67401fE9Ed5B4736Bc94D6Fb9F42CC46',
    AVATAR_MANAGER: MAXIM ? '' : '0xdE165766CC7C48C556c8C20247b322Dd23EB313a',
    MARTIAN_COLONISTS_ERC721: MAXIM ? '' : '0xDEfafb07765D9D0F897260BE1389743A09802F20',
    MISSION_MANAGER: MAXIM ? '' : '0xC0633bcaB848D1738Ad22A05135C8E9EC9265092',
    OWNER: MAXIM ? '' : '0xD8A6E21AeFa5C8F0b5CAb6b81C08662D710E134e',
    BACKEND_SIGNER: MAXIM ? '' : '',
  },
  mumbai: {
    GAME_MANAGER: '0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797',
    MC_ERC721: '0xBF5C3027992690d752be3e764a4B61Fc6910A5c0',
    CLNY_ERC20: '0x73E6432Ec675536BBC6825E16F1D427be44B9639',
    AVATAR_MANAGER: '0x85f8e0aBdb0f45D8488ca608Ac6327Edd3705de2',
    MARTIAN_COLONISTS_ERC721: '0x76F8089064f58586471f38824da290913E6a5454',
    MISSION_MANAGER: '0xf91719366dec915741E57b246f97048D4b5D338e',
    OWNER: '0x3A47a5be317DCF439F91D0A45716B64547F21bc1',
    BACKEND_SIGNER: '0xfbfe71afec1b7eb860542111b7a2ce5afaa2c11f',
  }
}

module.exports = async (callback) => {
  try {
    const CONTRACT_LIST = CONTRACTS[config.network];
    if (!CONTRACT_LIST) {
      console.log('WRONG NETWORK');
      callback();
      return;
    }
    const gm = await GM.at(CONTRACT_LIST.GAME_MANAGER);
    const mc = await MC.at(CONTRACT_LIST.MC_ERC721);
    const clny = await CLNY.at(CONTRACT_LIST.CLNY_ERC20);
    const am = await AM.at(CONTRACT_LIST.AVATAR_MANAGER);
    const mcl = await MCL.at(CONTRACT_LIST.MARTIAN_COLONISTS_ERC721);
    const mm = await MM.at(CONTRACT_LIST.MISSION_MANAGER);

    const expectAddress = async (promise, compare, name) => {
      expect(await promise).to.be.equal(compare, name);
      console.log(name, 'OK');
    };

    await expectAddress(gm.CLNYAddress(), clny.address, 'CLNYAddress');
    await expectAddress(gm.MCAddress(), mc.address, 'MCAddress');
    await expectAddress(gm.avatarAddress(), am.address, 'gm.avatarAddress()');
    await expectAddress(gm.missionManager(), mm.address, 'gm.missionManager()');
    await expectAddress(gm.martianColonists(), mcl.address, 'gm.martianColonists()');
    await expectAddress(gm.DAO(), CONTRACT_LIST.OWNER, 'gm.DAO()');

    await expectAddress(mc.GameManager(), gm.address, 'mc.GameManager()');
    await expectAddress(mc.DAO(), CONTRACT_LIST.OWNER, 'mc.DAO()');

    await expectAddress(clny.GameManager(), gm.address, 'clny.GameManager()');
    await expectAddress(clny.DAO(), CONTRACT_LIST.OWNER, 'clny.DAO()');

    await expectAddress(mcl.avatarManager(), am.address, 'mcl.avatarManager()');
    await expectAddress(mcl.owner(), CONTRACT_LIST.OWNER, 'mcl.owner()');

    await expectAddress(mm.DAO(), CONTRACT_LIST.OWNER, 'mm.DAO()');
    await expectAddress(mm.GameManager(), gm.address, 'mm.GameManager()');
    await expectAddress(mm.avatarManager(), am.address, 'mm.avatarManager()');
    await expectAddress(mm.MC(), mc.address, 'mm.MC()');
    await expectAddress(mm.collection(), mcl.address, 'mm.collection()');


    console.log('test passed');
  } catch (error) {
    console.error(error);
  }

  callback();
};
