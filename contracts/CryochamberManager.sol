// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './GameConnection.sol';
import './interfaces/IMartianColonists.sol';
import './interfaces/IAvatarManager.sol';
import './interfaces/ICryochamber.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';


contract CryochamberManager is GameConnection, PausableUpgradeable, ICryochamber {
  IMartianColonists public avatars;
  IAvatarManager public avatarManager;

  uint256 public override cryochamberPrice;
  uint256 public override energyPrice;
  uint256 public initialEnergy;
  uint256 public cryoEnergyCost; // energy decrease amount when avatar goes in cryochamber
  uint64 public cryoPeriodLength;

  // uint256 cryochambersCounter; 
  
  struct Cryochamber {
    uint256 energy; 
    bool isSet;
  }

  mapping (uint256 => CryoTime) private cryos;  // avatarId => array of avatar's cryo periods
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
  }

  function setCryochamberPrice(uint256 _price) external onlyDAO whenNotPaused {
    cryochamberPrice = _price;
  }

  function setCryochamberCost(uint256 _cost) external onlyDAO whenNotPaused {
    cryoEnergyCost = _cost;
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

  function purchaseCryochamber(address user) external override onlyGameManager {
    require(!cryochambers[user].isSet, "you have already purchased the cryochamber");

    cryochambers[user] = Cryochamber(initialEnergy, true);
  }

  function purchaseCryochamberEnergy(address user, uint256 _energyAmount) external override onlyGameManager hasCryochamber(user) {
    cryochambers[user].energy += _energyAmount;
  }

  function decreaseCryochamberEnergy(address user, uint256 _amount) private {
    Cryochamber storage cryochamber = cryochambers[user];
    require(cryochamber.energy >= _amount, "You have not enough energy in cryochamber, please buy more");
    cryochamber.energy -= _amount;
  }

  function isAvatarInCryoChamber(uint256 avatarId) public override view returns (bool) {
    CryoTime memory avatarCryo = cryos[avatarId];
    return avatarCryo.endTime > 0 && avatarCryo.endTime > uint64(block.timestamp);
  }

   function isInCryoChamber(uint256[] calldata avatarIds) external view returns (bool[] memory) {
    if (avatarIds.length == 0) {
      return new bool[](0);
    } else {
      bool[] memory result = new bool[](avatarIds.length);
      for (uint256 i = 0; i < avatarIds.length; i++) {
        result[i] = isAvatarInCryoChamber(avatarIds[i]);
      }
      return result;
    }
  }


  function putAvatarInCryochamber(uint256 avatarId, address user) private {
    require(avatars.ownerOf(avatarId) == msg.sender, "You are not an avatar owner");
    
    require(!isAvatarInCryoChamber(avatarId), "This avatar is in cryochamber already");

    // if last cryoperiod ended, add previous reward to xp

    CryoTime memory avatarCryo = cryos[avatarId];
    if (avatarCryo.endTime > 0 && avatarCryo.endTime <= uint64(block.timestamp)) {
      avatarManager.addXPAfterCryo(avatarId, avatarCryo.reward);
    }

    decreaseCryochamberEnergy(user, cryoEnergyCost);
    cryos[avatarId] = CryoTime(uint64(block.timestamp) + cryoPeriodLength, estimateXpAddition(avatarId));
  }

  function putAvatarsInCryochamber(uint256[] calldata avatarIds) external hasCryochamber(msg.sender) {
    for (uint256 i = 0; i < avatarIds.length; i++) {
      putAvatarInCryochamber(avatarIds[i], msg.sender);
    }
  }
  
  function numDigits(uint256 number) private pure returns (uint8) {
    uint8 digits = 0;
    while (number != 0) {
        number /= 10;
        digits++;
    }
    return digits;
  }

  function cryoXpAddition(uint256 currentXp) private pure returns (uint256) {
    if (currentXp <= 1000) {
      return uint256(400);
    } else {
      uint8 countOfDigits = numDigits(currentXp);
      return currentXp * (7 / (2**(countOfDigits-4) * 100));
    }
  }

  function estimateXpAddition(uint256 avatarId) public view returns (uint256) {
    uint256[] memory avatarArg = new uint256[](1);
    avatarArg[0] = avatarId;

    uint256[] memory currentXps = avatarManager.getXP(avatarArg);
    uint256 currentXp = currentXps[0];

    return cryoXpAddition(currentXp);

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

  function getAvatarCryo(uint256 avatarId) public override view returns (CryoTime memory) {
    return cryos[avatarId];
  }
}
