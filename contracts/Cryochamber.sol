// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './GameConnection.sol';
import './interfaces/IMartianColonists.sol';
import './interfaces/IAvatarManager.sol';
import './interfaces/IGameManager.sol';
import './interfaces/ERC20MintBurnInterface.sol';
import './interfaces/NFTMintableInterface.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';


contract CryochamberManager is GameConnection, PausableUpgradeable {
  IMartianColonists public avatars;
  IAvatarManager public avatarManager;
  NFTMintableInterface public MC;

  uint256 public cryochamberPrice;
  uint256 public energyPrice;
  uint256 private initialEnergy;
  uint256 private cryoCost;
  uint64 private cryoPeriodLength;
  uint256 private cryoXpAddition = 1000;

  // uint256 cryochambersCounter; 
  
  struct Cryochamber {
    // uint256 id;
    // address owner;
    uint256 energy; 
    bool isSet;
  }

  struct CryoTime {
    uint64 endTime;
  }

  mapping (uint256 => CryoTime[]) public cryos;  // avatarId => array of avatar's cryo periods
  mapping (address => Cryochamber) public cryochambers;

  
  uint256[49] private ______gap;

  function initialize(address _DAO, address _collection, address _avatarManager, address _MC) external initializer {
    GameConnection.__GameConnection_init(_DAO);
    PausableUpgradeable.__Pausable_init();
    avatars = IMartianColonists(_collection);
    avatarManager = IAvatarManager(_avatarManager);
    MC = NFTMintableInterface(_MC);
  }

  function setCryochamberPrice(uint256 _price) external onlyDAO whenNotPaused {
    cryochamberPrice = _price;
  }

  function setCryochamberCost(uint256 _cost) external onlyDAO whenNotPaused {
    cryoCost = _cost;
  }

  function setEnergyPrice(uint256 _price) external onlyDAO whenNotPaused {
    energyPrice = _price;
  }

  function getEnergyPrice() external view returns (uint256) {
    return energyPrice;
  }

  function setInitialEnergy(uint256 _energy) external onlyDAO whenNotPaused {
    initialEnergy = _energy;
  }

  function setCryoPeriodLength(uint64 _time) external onlyDAO whenNotPaused {
    cryoPeriodLength = _time;
  }

  function getCryoXpAddition() external view returns (uint256) {
    return cryoXpAddition;
  }


  function purchaseCryochamber(address user) external onlyGameManager {
    require(!cryochambers[user].isSet, "you have purchased the cryochamber already");

    cryochambers[user] = Cryochamber(initialEnergy, true);
  }

  function purchaseCryochamberEnergy(address user, uint256 _energyAmount) external onlyGameManager  {
    require(cryochambers[user].isSet, "you have not purchased cryochamber yet");

    cryochambers[user].energy += _energyAmount;
  }

  function decreaseCryochamberEnergy(address user, uint256 _amount) private {
    Cryochamber storage cryochamber = cryochambers[user];
    require(cryochamber.energy - _amount >= 0, "You have not enough energy in cryochamber, please buy more");
    cryochamber.energy -= _amount;
  }

  function checkIfAvatarIsNotInChamber (uint256 avatarId) private view {
    CryoTime[] memory avatarCryos = cryos[avatarId];
    
    if (avatarCryos.length == 0) {
      return;
    }

    CryoTime memory lastCryo = avatarCryos[avatarCryos.length - 1];
    require(uint64(block.timestamp) - lastCryo.endTime <= 0, "This avatar is in cryptochamber already");
  }

  function putAvatarInCryochamber(uint256 avatarId) external hasCryochamber {
    require(avatars.ownerOf(avatarId) == msg.sender, "You are not an avatar owner");

    checkIfAvatarIsNotInChamber(avatarId);

    decreaseCryochamberEnergy(msg.sender, cryoCost);
    cryos[avatarId].push(CryoTime(uint64(block.timestamp) + cryoPeriodLength));
  }

  function getAvatarCryos(uint256 avatarId) external view returns (CryoTime[] memory) {
    return cryos[avatarId];
  }
 

  function pause() external onlyGameManager {
    _pause();
  }

  function unpause() external onlyGameManager {
    _unpause();
  }

  modifier hasCryochamber {
    require(cryochambers[msg.sender].isSet, 'You have not purchased cryochamber yet');
    _;
  }


}
