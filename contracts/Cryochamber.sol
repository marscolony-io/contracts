// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './GameConnection.sol';
import './interfaces/IMartianColonists.sol';
import './interfaces/IAvatarManager.sol';
import './interfaces/IGameManager.sol';
import './interfaces/ERC20MintBurnInterface.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';


contract CryochamberManager is GameConnection, PausableUpgradeable {
  IMartianColonists public collection;
  IAvatarManager public avatarManager;
  NFTMintableInterface public MC;


  uint256 public cryochamberPrice;
  uint256 public energyPrice;

  uint256 cryochambersCounter; 
  
  struct Cryochamber {
    uint256 id;
    address owner;
    uint256 energy; 
    bool isSet;
  }

  struct avatarInCryochamber {
    uint256 cryochamberId;
    uint64 startTime;  // to check 7 days delay
  }


  mapping (uint256 => avatarInCryochamber) avatarInChamber; 
  mapping (address => Cryochamber) public cryochambers;

  
  uint256[49] private ______gap;

  function initialize(address _DAO, address _collection, address _avatarManager, address _MC) external initializer {
    GameConnection.__GameConnection_init(_DAO);
    PausableUpgradeable.__Pausable_init();
    collection = IMartianColonists(_collection);
    avatarManager = IAvatarManager(_avatarManager);
    MC = NFTMintableInterface(_MC);
  }

  function setCryochamberPrice(uint256 _price) external onlyDAO whenNotPaused {
    cryochamberPrice = _price;
  }

  function setEnergyPrice(uint256 _price) external onlyDAO whenNotPaused {
    energyPrice = _price;
  }

  function getEnergyPrice() external returns (uint256) {
    return energyPrice;
  }

  function purchase(address user) external onlyGameManager {
    require(!cryochambers[user].isSet, "you have purchased the cryochamber already");

    


    // create cryochamber

  }
 

  function pause() external onlyGameManager {
    _pause();
  }

  function unpause() external onlyGameManager {
    _unpause();
  }


}
