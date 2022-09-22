// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './GameConnection.sol';
import './interfaces/IMartianColonists.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/ICryochamber.sol';
import './interfaces/ICollectionManager.sol';
import './interfaces/ILootboxes.sol';
import './interfaces/IOracle.sol';
import './interfaces/IEnums.sol';
import './interfaces/IGears.sol';
import './interfaces/TokenInterface.sol';
import './Constants.sol';


contract CollectionManager is ICollectionManager, GameConnection, PausableUpgradeable, Constants {
  uint256 public maxTokenId;

  IMartianColonists public collection;
  mapping (uint256 => uint256) private xp;

  ICryochamber public cryochambers;
  address public gearsAddress;

  struct GearLocks {
    uint64 transportId;
    uint64 gear1Id;
    uint64 gear2Id;
    uint64 gear3Id;
    bool set;
    uint16 locks;
  }

  mapping (address => GearLocks) public gearLocks;

  IGears.Gear[] public initialCommonGears;
  IGears.Gear[] public initialRareGears;
  IGears.Gear[] public initialLegendaryGears;
  IGears.Gear[] public transportGears;

  address oracleAddress;

  // from 0 to 100
  mapping(address => uint8) public transportDamage; 

  uint256[40] private ______mc_gap;

    modifier onlyCryochamberManager {
    require(msg.sender == address(cryochambers), 'Only CryochamberManager');
    _;
  }

  function initialize(address _collection) external initializer {
    GameConnection.__GameConnection_init(msg.sender);
    PausableUpgradeable.__Pausable_init();
    maxTokenId = 0;
    collection = IMartianColonists(_collection);

    // gears 
    initialCommonGears.push(IGears.Gear(IEnums.Rarity.COMMON, ROCKET_FUEL, CATEGORY_ENGINE, COMMON_GEAR_DURABILITY, false, true));
    initialCommonGears.push(IGears.Gear(IEnums.Rarity.COMMON, TITANIUM_DRILL, CATEGORY_DRILL, COMMON_GEAR_DURABILITY, false, true));
    initialCommonGears.push(IGears.Gear(IEnums.Rarity.COMMON, SMALL_AREA_SCANNER, CATEGORY_SCANNER, COMMON_GEAR_DURABILITY, false, true));
    initialCommonGears.push(IGears.Gear(IEnums.Rarity.COMMON, ULTRASONIC_TRANSMITTER, CATEGORY_TRANSMITTER, COMMON_GEAR_DURABILITY, false, true));

    initialRareGears.push(IGears.Gear(IEnums.Rarity.RARE, ENGINE_FURIOUS, CATEGORY_ENGINE, RARE_GEAR_DURABILITY, false, true));
    initialRareGears.push(IGears.Gear(IEnums.Rarity.RARE, DIAMOND_DRILL, CATEGORY_DRILL, RARE_GEAR_DURABILITY, false, true));
    initialRareGears.push(IGears.Gear(IEnums.Rarity.RARE, MEDIUM_AREA_SCANNER, CATEGORY_SCANNER, RARE_GEAR_DURABILITY, false, true));
    initialRareGears.push(IGears.Gear(IEnums.Rarity.RARE, INFRARED_TRANSMITTER, CATEGORY_TRANSMITTER, RARE_GEAR_DURABILITY, false, true));
    
    initialLegendaryGears.push(IGears.Gear(IEnums.Rarity.LEGENDARY, WD_40, CATEGORY_ENGINE, LEGENDARY_GEAR_DURABILITY, false, true));
    initialLegendaryGears.push(IGears.Gear(IEnums.Rarity.LEGENDARY, LASER_DRILL, CATEGORY_DRILL, LEGENDARY_GEAR_DURABILITY, false, true));
    initialLegendaryGears.push(IGears.Gear(IEnums.Rarity.LEGENDARY, LARGE_AREA_SCANNER, CATEGORY_SCANNER, LEGENDARY_GEAR_DURABILITY, false, true));
    initialLegendaryGears.push(IGears.Gear(IEnums.Rarity.LEGENDARY, VIBRATION_TRANSMITTER, CATEGORY_TRANSMITTER, LEGENDARY_GEAR_DURABILITY, false, true));

    transportGears.push(IGears.Gear(IEnums.Rarity.LEGENDARY, THE_NEBUCHADNEZZAR, CATEGORY_TRANSPORT, TRANSPORT_GEAR_DURABILITY, false, true));
    transportGears.push(IGears.Gear(IEnums.Rarity.LEGENDARY, THE_WRAITH, CATEGORY_TRANSPORT, TRANSPORT_GEAR_DURABILITY, false, true));

  }

  function setCryochamberManager(address cryochamberManager) external {
    cryochambers = ICryochamber(cryochamberManager);
  }

  function setGearsAddress(address _address) external onlyDAO {
    gearsAddress = _address;
  }

  function setOracleAddress(address _address) external onlyDAO {
    oracleAddress = _address;
  }


  function _getXP(uint256 avatarId) private view returns(uint256) {
    uint256 totalAvatarsCount = collection.totalSupply();
    require(avatarId <= totalAvatarsCount, "wrong avatarId requested");
    return xp[avatarId] + 100; // 100 is a base for every avatar
  }

  function getXP(uint256[] memory avatarIds) public view returns(uint256[] memory) {
    uint256[] memory result = new uint256[](avatarIds.length);

    for (uint256 i = 0; i < avatarIds.length; i++) {
      
      result[i] = _getXP(avatarIds[i]);

      ICryochamber.CryoTime memory cryo = cryochambers.getAvatarCryoStatus(avatarIds[i]);
      
      if (cryo.endTime > 0 && uint64(block.timestamp) > cryo.endTime) {
        result[i] += cryo.reward;
      }
      
    }
    return result;
  }


  function addXP(uint256 avatarId, uint256 increment) external onlyGameManager {
    xp[avatarId] = xp[avatarId] + increment;
  }

  function addXPAfterCryo(uint256 avatarId, uint256 increment) external onlyCryochamberManager {
    xp[avatarId] = xp[avatarId] + increment;
  }

  function allMyTokens() external view returns(uint256[] memory) {
    uint256 tokenCount = collection.balanceOf(msg.sender);
    if (tokenCount == 0) {
      return new uint256[](0);
    } else {
      uint256[] memory result = new uint256[](tokenCount);
      for (uint256 i = 0; i < tokenCount; i++) {
        result[i] = collection.tokenOfOwnerByIndex(msg.sender, i);
      }
      return result;
    }
  }

  function setMaxTokenId(uint256 _maxTokenId) external onlyDAO {
    require(_maxTokenId > maxTokenId, 'can only increase');
    maxTokenId = _maxTokenId;
  }

  function ableToMint() view public returns (bool) {
    return collection.totalSupply() < maxTokenId;
  }

  function mint(address receiver) external onlyGameManager whenNotPaused {
    require (ableToMint(), 'cannot mint');
    collection.mint(receiver);
  }

  function pause() external onlyGameManager {
    _pause();
  }

  function unpause() external onlyGameManager {
    _unpause();
  }

  function setName(uint256 tokenId, string memory _name) external {
    require (collection.ownerOf(tokenId) == msg.sender, 'not your token');
    require (bytes(_name).length > 0, 'empty name');
    require (bytes(_name).length <= 15, 'name too long');
    require (bytes(collection.names(tokenId)).length == 0, 'name is already set');
    collection.setName(tokenId, _name);
  }

  function setNameByGameManager(uint256 tokenId, string memory _name) external onlyGameManager {
    require (bytes(_name).length <= 15, 'name too long');
    require (keccak256(abi.encodePacked(_name)) != keccak256(abi.encodePacked(collection.names(tokenId))), 'same name');
    collection.setName(tokenId, _name);
  }

  function getNames(uint256[] calldata tokenIds) external view returns (string[] memory) {
    string[] memory result = new string[](tokenIds.length);
    for (uint256 i = 0; i < tokenIds.length; i++) {
      result[i] = collection.names(tokenIds[i]);
    }
    return result;
  }

  // gears

  function getRandomizedGear(IEnums.Rarity _lootboxRarity, IEnums.Rarity _gearRarity) public view returns (IGears.Gear memory gear) {
    if (_lootboxRarity == IEnums.Rarity.RARE && _gearRarity == IEnums.Rarity.LEGENDARY) {
      // exclude transports
      uint256 modulo = randomNumber(initialLegendaryGears.length) ;
      return initialLegendaryGears[modulo];
    }

    if (_gearRarity == IEnums.Rarity.COMMON) {
      uint256 modulo = randomNumber(initialCommonGears.length);
      return initialCommonGears[modulo];
    }

    if (_gearRarity == IEnums.Rarity.RARE) {
      uint256 modulo = randomNumber(initialRareGears.length);
      return initialRareGears[modulo];
    }

    if (_gearRarity == IEnums.Rarity.LEGENDARY) {
      // choose from legendary and transports arrays
  
      uint256 modulo = randomNumber(initialLegendaryGears.length + transportGears.length);
      if (modulo < initialLegendaryGears.length) return initialLegendaryGears[modulo];
      return transportGears[modulo - initialLegendaryGears.length];
    }

  }

  function randomNumber(uint modulo) private view returns (uint) {
    return (uint(blockhash(block.number - 1)) + block.timestamp) % modulo;
  }

  function getRandomizedGearRarity(IEnums.Rarity _lootBoxRarity) private view returns (IEnums.Rarity gearRarity) {

    if (_lootBoxRarity == IEnums.Rarity.COMMON) {
      if (randomNumber(10) < 1) {
        return IEnums.Rarity.RARE; // 10%
      }
      return IEnums.Rarity.COMMON; // 90%
    }

    if (_lootBoxRarity == IEnums.Rarity.RARE) {
      if (randomNumber(100) > 85) { 
        return IEnums.Rarity.COMMON; // 15%
      }

      if (randomNumber(100) > 70) {
        return IEnums.Rarity.LEGENDARY; // 15%
      }
      
      return IEnums.Rarity.RARE; // 70%
    }

    if (_lootBoxRarity == IEnums.Rarity.LEGENDARY) {
      if (randomNumber(10) < 1) {
        return IEnums.Rarity.RARE; // 10%
      }
      return IEnums.Rarity.LEGENDARY; // 90%
    }
  }

  function calculateGear(IEnums.Rarity _lootBoxRarity) public view returns (IGears.Gear memory) {
    IEnums.Rarity gearRarity = getRandomizedGearRarity(_lootBoxRarity);
    IGears.Gear memory gear = getRandomizedGear(_lootBoxRarity, gearRarity);
    return gear;
  }

  function isUnique(uint64 idToCheck, uint64 id1, uint64 id2, uint64 id3) internal pure returns(bool) {
    return idToCheck != id1 && idToCheck != id2 && idToCheck != id3;
  }

  function setLocks(uint64 transportId, uint64 gear1Id, uint64 gear2Id, uint64 gear3Id) external {
    
    uint specialTransportType;

    if (transportId != 0) {
      require(msg.sender == TokenInterface(gearsAddress).ownerOf(transportId), "you are not transport owner");
      (, uint256 gearType, uint256 category, , , ) = IGears(gearsAddress).gears(transportId); 
      require(category == CATEGORY_TRANSPORT, "transportId is not transport");
      specialTransportType = gearType;
    }

    uint256 gear1Category;
    uint256 gear2Category;
    uint256 gear3Category;

    uint gearsCount;

    if (gear1Id != 0) {
      require(msg.sender == TokenInterface(gearsAddress).ownerOf(gear1Id), "you are not gear owner");
      (, , uint256 category, , , ) = IGears(gearsAddress).gears(gear1Id);
      require(category != CATEGORY_TRANSPORT, "can not lock transport as gear");
      gear1Category = category;
      gearsCount+=1;
    }

    if (gear2Id != 0) {
      require(msg.sender == TokenInterface(gearsAddress).ownerOf(gear2Id), "you are not gear owner");
      (, , uint256 category, , , ) = IGears(gearsAddress).gears(gear2Id);
      require(category != CATEGORY_TRANSPORT, "can not lock transport as gear");
      gear2Category = category;
      gearsCount+=1;
    }

    if (gear3Id != 0) {
      require(msg.sender == TokenInterface(gearsAddress).ownerOf(gear3Id), "you are not gear owner");
      (, , uint256 category, , , ) = IGears(gearsAddress).gears(gear3Id);
      require(category != CATEGORY_TRANSPORT, "can not lock transport as gear");
      gear3Category = category;
      gearsCount+=1;
    }

        // if user doesn't lock special transport, he can lock up to 2 gears. otherwise up to 3 
    if (specialTransportType != THE_NEBUCHADNEZZAR) {
      require(gearsCount < 3, "can not lock 3 gears without special transport");
    }


    if (gear1Id != 0 && gear2Id != 0) {
      require(gear1Category != gear2Category, "you can't lock gears of the same category");
    }

    if (gear1Id != 0 && gear3Id != 0) {
      require(gear1Category != gear3Category, "you can't lock gears of the same category");
    }

    if (gear2Id != 0 && gear3Id != 0) {
      require(gear2Category != gear3Category, "you can't lock gears of the same category");
    }

    // unlock prev locked transport and gear
    GearLocks memory prevLockedGears = gearLocks[msg.sender];

    if (prevLockedGears.set) {
      if (prevLockedGears.transportId != 0 && prevLockedGears.transportId != transportId) {
        IGears(gearsAddress).unlockGear(prevLockedGears.transportId);
      }

      if (isUnique(prevLockedGears.gear1Id, gear1Id, gear2Id, gear3Id)) {
        IGears(gearsAddress).unlockGear(prevLockedGears.gear1Id);
      }

      if (isUnique(prevLockedGears.gear2Id, gear1Id, gear2Id, gear3Id)) {
        IGears(gearsAddress).unlockGear(prevLockedGears.gear2Id);
      }

      if (isUnique(prevLockedGears.gear3Id, gear1Id, gear2Id, gear3Id)) {
        IGears(gearsAddress).unlockGear(prevLockedGears.gear3Id);
      }
    }

    // update state by rewrite
    uint16 locks = prevLockedGears.locks;
    if (locks == type(uint16).max) {
      locks = 0;
    } else {
      locks++;
    }

    // lock current gears

    if (transportId != 0 && transportId != prevLockedGears.transportId ) {
      IGears(gearsAddress).lockGear(transportId);
    }

    if (gear1Id != 0 && isUnique(gear1Id, prevLockedGears.gear1Id, prevLockedGears.gear2Id, prevLockedGears.gear3Id)) {
      IGears(gearsAddress).lockGear(gear1Id);
    }

    if (gear2Id != 0 && isUnique(gear2Id, prevLockedGears.gear1Id, prevLockedGears.gear2Id, prevLockedGears.gear3Id)) {
      IGears(gearsAddress).lockGear(gear2Id);
    }

    if (gear3Id != 0 && isUnique(gear3Id, prevLockedGears.gear1Id, prevLockedGears.gear2Id, prevLockedGears.gear3Id)) {
      IGears(gearsAddress).lockGear(gear3Id);
    }

    gearLocks[msg.sender] = GearLocks(transportId, gear1Id, gear2Id, gear3Id, true, locks);

  }

  function mintGear(address owner, IEnums.Rarity _lootBoxrarity) external onlyGameManager {
    IGears.Gear memory gear = calculateGear(_lootBoxrarity);
    IGears(gearsAddress).mint(owner, gear.rarity, gear.gearType, gear.category, gear.durability);
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyDAO {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }

  function getLootboxOpeningPrice() external view returns (uint256 common, uint256 rare, uint256 legendary) {
    (bool valid, uint256 clnyInUsd) = IOracle(oracleAddress).clnyInUsd();
    
    require(valid, "oracle price of clny is not valid");
    
    common = COMMON_OPENING_PRICE_USD*clnyInUsd/100; // from cents to usd
    rare = RARE_OPENING_PRICE_USD*clnyInUsd/100; 
    legendary = LEGENDARY_OPENING_PRICE_USD*clnyInUsd/100;
  }

  function getLockedGears(address user) external view returns (uint256[] memory, IGears.Gear[] memory, uint locksCount) {
    GearLocks memory locks = gearLocks[user];

    if (!locks.set) {
      return (new uint256[](0), new IGears.Gear[](0), 0);
    }

    uint256[] memory ids = new uint256[](4);
    IGears.Gear[] memory gearsResult = new IGears.Gear[](4);
     
    ids[0] = locks.transportId;
    ids[1] = locks.gear1Id;
    ids[2] = locks.gear2Id;
    ids[3] = locks.gear3Id;
     
    (IEnums.Rarity rarity, uint256 gearType, uint256 category, uint256 durability, bool locked, bool set) = IGears(gearsAddress).gears(locks.transportId);
    gearsResult[0] = IGears.Gear(rarity, gearType, category, durability,locked, set);

    (rarity, gearType, category, durability, locked, set) = IGears(gearsAddress).gears(locks.gear1Id);
    gearsResult[1] = IGears.Gear(rarity, gearType, category, durability, locked, set);

    (rarity, gearType, category, durability, locked, set) = IGears(gearsAddress).gears(locks.gear2Id);
    gearsResult[2] = IGears.Gear(rarity, gearType, category, durability,locked, set);

    (rarity, gearType, category, durability, locked, set) = IGears(gearsAddress).gears(locks.gear3Id);
    gearsResult[3] = IGears.Gear(rarity, gearType, category, durability,locked, set);
      
    return (ids, gearsResult, locks.locks);
  }

  function increaseTransortDamage(address transport, uint8 _damage) external onlyGameManager {
    uint8 damage = transportDamage[transport];
    
    if(damage + _damage > 100) {
      transportDamage[transport] = 100;
      return;
    }

    transportDamage[transport] = damage + _damage;
  }

}
