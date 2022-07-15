// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import "@openzeppelin/contracts/utils/math/Math.sol";
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

  uint256[99] private xpEdges;
  uint256[100] private xpAdditions;
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
    xpEdges = [100,1000,2044,3255,4660,6289,8180,10372,12916,15867,19289,23260,27865,33208,39405,46594,54933,64606,75827,88843,103942,121456,141773,165341,192680,224393,261179,303852,353352,410773,477381,554645,644273,748240,868843,1008742,1171024,1359272,1577640,1830946,2124782,2465631,2861015,3319662,3851692,4468847,5184746,6015189,6978504,8095948,9392184,10895817,12640032,14663321,17010337,19732874,22891018,26554465,30804064,35733598,41451858,48085039,55779529,64705138,75058844,87069143,101001090,117162148,135908976,157655296,182881027,212142876,246086620,285461363,331136065,384118719,445578598,516872058,599572471,695504951,806786627,935873371,1085613995,1259313118,1460804101,1694533641,1965659907,2280166376,2644993880,3068193785,3559105675,4128563467,4789134506,5555396911,6444261300,7475343992,8671399915,10058824786,11668237635];
    xpAdditions = [500,560,627,702,786,881,986,1105,1237,1386,1552,1739,1947,2181,2443,2736,3065,3433,3844,4306,4823,5401,6050,6776,7589,8500,9520,10662,11941,13374,14979,16777,18790,21045,23571,26399,29567,33115,37089,41540,46525,52108,58361,65364,73208,81993,91833,102853,115195,129018,144501,161841,181262,203013,227375,254660,285219,319445,357779,400712,448798,502654,562972,630529,706193,790936,885848,992150,1111208,1244553,1393899,1561167,1748508,1958329,2193328,2456527,2751311,3081468,3451244,3865394,4329241,4848750,5430600,6082272,6812145,7629602,8545155,9570573,10719042,12005327,13445967,15059483,16866621,18890615,21157489,23696388,26539954,29724749,33291719,37286725];  
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

  function timeToStayInCryoChamber(uint256 avatarId) public override view returns (uint256) {
    CryoTime memory avatarCryo = cryos[avatarId];
    if (avatarCryo.endTime == 0 || avatarCryo.endTime <= uint64(block.timestamp)) return 0;
    return avatarCryo.endTime - uint64(block.timestamp);
  }

  function isInCryoChamber(uint256[] calldata avatarIds) external view returns (uint256[] memory) {
    if (avatarIds.length == 0) {
      return new uint256[](0);
    } else {
      uint256[] memory result = new uint256[](avatarIds.length);
      for (uint256 i = 0; i < avatarIds.length; i++) {
        result[i] = timeToStayInCryoChamber(avatarIds[i]);
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
    cryos[avatarId] = CryoTime(uint64(block.timestamp) + cryoPeriodLength, estimateXpAddition(avatarId) * cryoPeriodLength  / (24 * 60 * 60));
  }

  function putAvatarsInCryochamber(uint256[] calldata avatarIds) external hasCryochamber(msg.sender) {
    for (uint256 i = 0; i < avatarIds.length; i++) {
      putAvatarInCryochamber(avatarIds[i], msg.sender);
    }
  }
  

  function findLevelFromXp(uint256 element) public view returns (uint256) {
  
    uint256 low = 0;
    uint256 high = xpEdges.length;

    while (low < high) {
        uint256 mid = Math.average(low, high);

        if (xpEdges[mid] > element) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    if (low > 0 && xpEdges[low - 1] == element) {
        return low - 1;
    } else {
        return low;
    }
  }

  function cryoXpAddition(uint256 currentXp) public view returns (uint256) {
    if (currentXp < 1000) {
      return uint256(400);
    } 

    if (currentXp > xpAdditions[xpAdditions.length - 1]) {
      return xpAdditions[xpAdditions.length - 1];
    } 

    uint256 level = findLevelFromXp(currentXp);
    return xpAdditions[level - 1];
  }

  function estimateXpAddition(uint256 avatarId) public view returns (uint256) {
    uint256[] memory avatarArg = new uint256[](1);
    avatarArg[0] = avatarId;

    uint256[] memory currentXps = avatarManager.getXP(avatarArg);
    uint256 currentXp = currentXps[0];

    return cryoXpAddition(currentXp);

  }

  function bulkEstimateXpAddition(uint256[] calldata avatarIds) public view returns (uint256[] memory) {
    if (avatarIds.length == 0) {
      return new uint256[](0);
    } else {
      uint256[] memory result = new uint256[](avatarIds.length);
      for (uint256 i = 0; i < avatarIds.length; i++) {
        result[i] = estimateXpAddition(avatarIds[i]);
      }
      return result;
    }
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

  function getAvatarCryoStatus(uint256 avatarId) public override view returns (CryoTime memory) {
    return cryos[avatarId];
  }

}
