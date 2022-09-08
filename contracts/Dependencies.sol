// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './interfaces/IDependencies.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Dependencies is IDependencies, Ownable {
  address public treasury;
  address public liquidity;
  ICLNY public clny;
  ICollectionManager public collectionManager;
  ICryochamber public cryochamber;
  IGameManager public gameManager;
  IGears public gears;
  ILootboxes public lootboxes;
  IMartianColonists public martianColonists;
  IMC public mc;
  IMissionManager public missionManager;
  IOracle public oracle;
  ISalesManager public salesManager;

  function owner() public view override(Ownable, IDependencies) returns (address) {
    return super.owner();
  }

  function setTreasury(address addr) external onlyOwner {
    treasury = addr;
  }

  function setLiquidity(address addr) external onlyOwner {
    liquidity = addr;
  }

  function setClny(ICLNY addr) external onlyOwner {
    clny = addr;
  }
  
  function setCollectionManager(ICollectionManager addr) external onlyOwner {
    collectionManager = addr;
  }

  function setCyochamber(ICryochamber addr) external onlyOwner {
    cryochamber = addr;
  }

  function setGameManager(IGameManager addr) external onlyOwner {
    gameManager = addr;
  }

  function setGears(IGears addr) external onlyOwner {
    gears = addr;
  }

  function setLootboxes(ILootboxes addr) external onlyOwner {
    lootboxes = addr;
  }

  function setMartianColonists(IMartianColonists addr) external onlyOwner {
    martianColonists = addr;
  }

  function setMc(IMC addr) external onlyOwner {
    mc = addr;
  }

  function setMissionManager(IMissionManager addr) external onlyOwner {
    missionManager = addr;
  }

  function setOracle(IOracle addr) external onlyOwner {
    oracle = addr;
  }

  function setSalesManager(ISalesManager addr) external onlyOwner {
    salesManager = addr;
  }
}
