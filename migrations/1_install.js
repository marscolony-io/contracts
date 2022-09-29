const { deployProxy } = require("@openzeppelin/truffle-upgrades");

const Dependencies = artifacts.require("Dependencies");
const MC = artifacts.require("MC");
const MartianColonists = artifacts.require("MartianColonists");
const CLNY = artifacts.require("CLNY");
const Lootboxes = artifacts.require("Lootboxes");
const Gears = artifacts.require("Gears");
const GameManagerFixed = artifacts.require("GameManagerFixed");
const GameManagerShares = artifacts.require("GameManagerShares");
const CollectionManager = artifacts.require("CollectionManager");
const MissionManager = artifacts.require("MissionManager");
const CryochamberManager = artifacts.require("CryochamberManager");
const MissionLibrary = artifacts.require("MissionLibrary");

const ECONOMY = {
  SHARES: 1,
  FIXED: 2,
};

module.exports = async (deployer, network, [owner, , , , , , treasury, liquidity]) => {
  await deployProxy(Dependencies);
  const d = await Dependencies.deployed();
  const economy = ['mumbai', 'polygon'].includes(network) ? ECONOMY.SHARES : ECONOMY.FIXED;
  const GameManager = economy === ECONOMY.SHARES ? GameManagerShares : GameManagerFixed;

  await deployer.deploy(MissionLibrary);
  await deployer.link(await MissionLibrary.deployed(), GameManager);

  await deployer.deploy(CLNY, 'CLNY', d.address);
  console.log(await d.owner());
  await d.setClny(CLNY.address, { from: owner });
  await deployer.deploy(MC, 'https://meta.marscolony.io/', d.address);
  await d.setMc(MC.address);
  await deployer.deploy(MartianColonists, 'https://google.com/', d.address);
  await d.setMartianColonists(MartianColonists.address);
  await deployer.deploy(Lootboxes, 'https://google.com/', d.address);
  await d.setLootboxes(Lootboxes.address);
  await deployer.deploy(Gears, 'https://google.com/', d.address);
  await d.setGears(Gears.address);

  // TODO allowance for CLNY contract for shares economy

  await deployProxy(GameManager, [d.address], { deployer, unsafeAllow: ['external-library-linking'] });
  await d.setGameManager(GameManager.address);
  await deployProxy(CollectionManager, [d.address], { deployer });
  await d.setCollectionManager(CollectionManager.address);
  await deployProxy(MissionManager, [d.address], { deployer });
  await d.setMissionManager(MissionManager.address);
  await deployProxy(CryochamberManager, [d.address], { deployer });
  await d.setCryochamber(CryochamberManager.address);

  // TODO oracle

  await d.setTreasury(treasury);
  await d.setLiquidity(liquidity);
  
  // await d.setBackendSigner(...);
};
