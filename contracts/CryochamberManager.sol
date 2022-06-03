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

  uint256 public cryochamberPrice;
  uint256 public energyPrice;
  uint256 public initialEnergy;
  uint256 public cryoEnergyCost; // energy decrease amount when avatar goes in cryochamber
  uint64 public cryoPeriodLength;
  uint256 public cryoXpAddition;

  // uint256 cryochambersCounter; 
  
  struct Cryochamber {

    uint256 energy; 
    bool isSet;
  }

  struct CryoTime {
    uint64 endTime;
    uint256 reward;
  }

  mapping (uint256 => CryoTime) public cryos;  // avatarId => array of avatar's cryo periods
  mapping (address => Cryochamber) public cryochambers;

  
  uint256[49] private ______gap;

  function initialize(address _DAO, address _collection, address _avatarManager) external initializer {
    GameConnection.__GameConnection_init(_DAO);
    PausableUpgradeable.__Pausable_init();
    avatars = IMartianColonists(_collection);
    avatarManager = IAvatarManager(_avatarManager);

    cryochamberPrice = 30 * 10 ** 18;
    energyPrice = 5 * 10 ** 18;
    initialEnergy = 5;
    cryoEnergyCost = 1;
    cryoPeriodLength = 7 * 24 * 60 * 60; 
    cryoXpAddition = 1000;
  }

  function setCryochamberPrice(uint256 _price) external onlyDAO whenNotPaused {
    cryochamberPrice = _price;
  }

  function setCryochamberCost(uint256 _cost) external onlyDAO whenNotPaused {
    cryoEnergyCost = _cost;
  }

  function setCryoXpAddition(uint256 addition) external onlyDAO whenNotPaused {
    cryoXpAddition = addition;
  }

  function setEnergyPrice(uint256 _price) external onlyDAO whenNotPaused {
    energyPrice = _price;
  }

  function setInitialEnergy(uint256 _energy) external onlyDAO whenNotPaused {
    initialEnergy = _energy;
  }

  function setCryoPeriodLength(uint64 _time) external onlyDAO whenNotPaused {
    cryoPeriodLength = _time;
  }

  function purchaseCryochamber(address user) external onlyGameManager {
    require(!cryochambers[user].isSet, "you have already purchased the cryochamber");

    cryochambers[user] = Cryochamber(initialEnergy, true);
  }

  function purchaseCryochamberEnergy(address user, uint256 _energyAmount) external onlyGameManager hasCryochamber(user) {
    cryochambers[user].energy += _energyAmount;
  }

  function decreaseCryochamberEnergy(address user, uint256 _amount) private {
    Cryochamber storage cryochamber = cryochambers[user];
    require(cryochamber.energy >= _amount, "You have not enough energy in cryochamber, please buy more");
    cryochamber.energy -= _amount;
  }

  function isAvatarInCryoChamber(CryoTime memory avatarCryo) public view returns (bool) {
    return avatarCryo.endTime > 0 && avatarCryo.endTime > uint64(block.timestamp);
  }

  function isAvatarCryoFinished(CryoTime memory avatarCryo) public view returns (bool) {
    return avatarCryo.endTime > 0 && uint64(block.timestamp) > avatarCryo.endTime;
  }

  function putAvatarInCryochamber(uint256 avatarId) external hasCryochamber(msg.sender) {
    require(avatars.ownerOf(avatarId) == msg.sender, "You are not an avatar owner");

    CryoTime memory avatarCryo = cryos[avatarId];

    require(!isAvatarInCryoChamber(avatarCryo), "This avatar is in cryptochamber already");

    // if last cryoperiod ended, add previous reward to xp

    if (avatarCryo.endTime > 0 && avatarCryo.endTime <= uint64(block.timestamp)) {
      avatarManager.addXPAfterCryo(avatarId, avatarCryo.reward);
    }

    decreaseCryochamberEnergy(msg.sender, cryoEnergyCost);
    cryos[avatarId] = CryoTime(uint64(block.timestamp) + cryoPeriodLength, cryoXpAddition);
  }

 
  function pause() external onlyGameManager {
    _pause();
  }

  function unpause() external onlyGameManager {
    _unpause();
  }

  modifier hasCryochamber(address user) {
    require(cryochambers[user].isSet, 'You have not purchased cryochamber yet');
    _;
  }


}
