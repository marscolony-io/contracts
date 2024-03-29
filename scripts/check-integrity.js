const { assert, expect } = require("chai");

const GM = artifacts.require("GameManagerShares");
const MC = artifacts.require("MC");
const CLNY = artifacts.require("CLNY");
const CM = artifacts.require("CollectionManager");
const MCL = artifacts.require("MartianColonists");
const MM = artifacts.require("MissionManager");
const CC = artifacts.require("CryochamberManager");

const MAXIM = Boolean(process.env.MAXIM);

const CONTRACTS = {
  harmony: {
    GAME_MANAGER: "0x0D112a449D23961d03E906572D8ce861C441D6c3",
    MC_ERC721: "0x0bC0cdFDd36fc411C83221A348230Da5D3DfA89e",
    CLNY_ERC20: "0x0D625029E21540aBdfAFa3BFC6FD44fB4e0A66d0",
    COLLECTION_MANAGER: "0xCc55065afd013CF06f989448cf724fEC4fF29626",
    MARTIAN_COLONISTS_ERC721: "0xFDCC01E0Fe5D3Fb11B922447093EE6862685616c",
    MISSION_MANAGER: "0x0Ef27447c72Fc9809864E1aa3998B76B61c20a8A", // TODO
    OWNER: "0x3A47a5be317DCF439F91D0A45716B64547F21bc1",
    BACKEND_SIGNER: "0xb00b24E974834492A26b34ABCA26b952F1aB35d5",
    CRYOCHAMBER: "0x2D2f5349896BF4012EA27Db345fbF8a71775d16f",
  },
  hartest: {
    GAME_MANAGER: MAXIM ? "" : "0xc65F8BA708814653EDdCe0e9f75827fe309E29aD",
    MC_ERC721: MAXIM ? "" : "0xc268D8b64ce7DB6Eb8C29562Ae538005Fded299A",
    CLNY_ERC20: MAXIM ? "" : "0x6b1a8FED67401fE9Ed5B4736Bc94D6Fb9F42CC46",
    COLLECTION_MANAGER: MAXIM
      ? ""
      : "0xdE165766CC7C48C556c8C20247b322Dd23EB313a",
    MARTIAN_COLONISTS_ERC721: MAXIM
      ? ""
      : "0xDEfafb07765D9D0F897260BE1389743A09802F20",
    MISSION_MANAGER: MAXIM ? "" : "0xC0633bcaB848D1738Ad22A05135C8E9EC9265092",
    OWNER: MAXIM ? "" : "0xD8A6E21AeFa5C8F0b5CAb6b81C08662D710E134e",
    BACKEND_SIGNER: MAXIM ? "" : "",
    CRYOCHAMBER: "",
  },
  fuji: {
    GAME_MANAGER: '0x0Dd5dDaC089613F736e89F81E16361b09c7d53C6',
    MC_ERC721: '0x031D6A8eD3d5ad28b026FF2098Fc2a1d0DB9DcF2',
    CLNY_ERC20: '0xC6C5b8a181Bbb8AB5cB88dBF424892ee278f6BBc',
    AVATAR_MANAGER: '0x0D625029E21540aBdfAFa3BFC6FD44fB4e0A66d0',
    MARTIAN_COLONISTS_ERC721: '0x30D378d6dF8d574d25874056483189df1341214B',
    MISSION_MANAGER: '0xf3f2f703b7BaAfD09f7a1C41b06e2D04B0Fad09C',
    OWNER: '0x3A47a5be317DCF439F91D0A45716B64547F21bc1',
    BACKEND_SIGNER: '0xeA81c9035b98A68A0Ef55aB3FC7503bAFC28ff52',
    CRYOCHAMBER: '0x9166461379cF2fd6633e13A115B367DE46c29101',
  },
  polygon: {
    GAME_MANAGER: '0xCAFAeD55fEfEd74Ca866fE72D65CfF073eb42797',
    MC_ERC721: '0x3B45B2AEc65A4492B7bd3aAd7d9Fa8f82B79D4d0',
    CLNY_ERC20: '0xCEBaF32BBF205aDB2BcC5d2a5A5DAd91b83Ba424',
    AVATAR_MANAGER: '0xE29163dE0dD747f55d5D2287d5FE874F65C9Fa8E',
    MARTIAN_COLONISTS_ERC721: '0x76F8089064f58586471f38824da290913E6a5454',
    MISSION_MANAGER: '',
    OWNER: '0x3A47a5be317DCF439F91D0A45716B64547F21bc1',
    BACKEND_SIGNER: '',
    CRYOCHAMBER: '0x4B895e733B8F1D50ec7f92BccCF763f85b5f963b',
  }
}

module.exports = async (callback) => {
  try {
    const CONTRACT_LIST = CONTRACTS[config.network];
    if (!CONTRACT_LIST) {
      console.log("WRONG NETWORK");
      callback();
      return;
    }
    const gm = await GM.at(CONTRACT_LIST.GAME_MANAGER);
    const mc = await MC.at(CONTRACT_LIST.MC_ERC721);
    const clny = await CLNY.at(CONTRACT_LIST.CLNY_ERC20);
    const cm = await CM.at(CONTRACT_LIST.COLLECTION_MANAGER);
    const mcl = await MCL.at(CONTRACT_LIST.MARTIAN_COLONISTS_ERC721);
    // const mm = await MM.at(CONTRACT_LIST.MISSION_MANAGER);
    const cc = await CC.at(CONTRACT_LIST.CRYOCHAMBER);

    expect(await gm.CLNYAddress()).to.be.equal(
      clny.address,
      "gm.CLNYAddress()"
    );
    expect(await gm.MCAddress()).to.be.equal(mc.address, "gm.MCAddress()");
    expect(await gm.avatarAddress()).to.be.equal(
      am.address,
      "gm.avatarAddress()"
    );
    expect(await gm.missionManager()).to.be.equal(
      mm.address,
      "gm.missionManager()"
    );
    expect(await gm.martianColonists()).to.be.equal(
      mcl.address,
      "gm.martianColonists()"
    );
    expect(await gm.DAO()).to.be.equal(CONTRACT_LIST.OWNER, "gm.DAO()");
    expect(await gm.backendSigner()).to.be.equal(
      CONTRACT_LIST.BACKEND_SIGNER,
      "gm.backendSigner()"
    );

    expect(await mc.GameManager()).to.be.equal(gm.address, "mc.GameManager()");
    expect(await mc.DAO()).to.be.equal(CONTRACT_LIST.OWNER, "mc.DAO()");

    expect(await clny.GameManager()).to.be.equal(
      gm.address,
      "clny.GameManager()"
    );
    expect(await clny.DAO()).to.be.equal(CONTRACT_LIST.OWNER, "clny.DAO()");

    expect(await mcl.avatarManager()).to.be.equal(
      am.address,
      "mcl.avatarManager()"
    );
    expect(await mcl.owner()).to.be.equal(CONTRACT_LIST.OWNER, "mcl.owner()");

    expect(await mm.DAO()).to.be.equal(CONTRACT_LIST.OWNER, "mm.DAO()");
    expect(await mm.GameManager()).to.be.equal(gm.address, "mm.GameManager()");
    expect(await mm.avatarManager()).to.be.equal(
      am.address,
      "mm.avatarManager()"
    );
    expect(await mm.MC()).to.be.equal(mc.address, "mm.MC()");
    expect(await mm.collection()).to.be.equal(mcl.address, "mm.collection()");

    expect(await gm.cryochamberAddress()).to.be.equal(
      CONTRACT_LIST.CRYOCHAMBER,
      "gm.cryochamberAddress()"
    );
    expect(await cm.cryochambers()).to.be.equal(
      CONTRACT_LIST.CRYOCHAMBER,
      "cm.cryochambers()"
    );
    expect(await cc.GameManager()).to.be.equal(gm.address, "cc.GameManager()");
    expect(await cc.avatarManager()).to.be.equal(
      am.address,
      "cc.avatarManager()"
    );
    expect(await cc.avatars()).to.be.equal(mcl.address, "cc.avatars()");

    console.log("test passed");
  } catch (error) {
    console.error(error);
  }

  callback();
};
