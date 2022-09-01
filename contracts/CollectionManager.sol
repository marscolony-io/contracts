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
    uint256 transportId;
    uint256[] gearsId;
    bool set;
  }

  mapping (address => GearLocks) gearLocks;

  IGears.Gear[] public initialCommonGears;
  IGears.Gear[] public initialRareGears;
  IGears.Gear[] public initialLegendaryGears;
  IGears.Gear[] public transportGears;

  address oracleAddress;

  uint256[41] private ______mc_gap;

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

  function isGearCategoryChoosenBefore(uint256[] memory categories, uint256 category) private pure returns (bool) {
    for (uint i = 0; i < categories.length; i++) {
      if (categories[i] == category) {
        return true;
      }
    }
    return false;
  }

  function setLocks(uint256[] calldata tokenIds, uint256 transportId) external {
    
    // if user doesn't lock special transport, he can lock up to 2 gears. otherwise up to 3 
    if (transportId == 0) {
      require(tokenIds.length <= 2, "you can't lock so many gears");
    } else {
      ( , , uint256 category, , , ) = IGears(gearsAddress).gears(transportId); 
      require(category == CATEGORY_TRANSPORT, "transportId is not transport");

      require(msg.sender == TokenInterface(gearsAddress).ownerOf(transportId), "you are not transport owner");
      require(tokenIds.length <= 3, "you can't lock so many gears");
    }

    // can not lock gears of the same categories
    uint256[] memory choosenCategories = new uint256[](3);
    for (uint i = 0; i < tokenIds.length; i++) {
      require(msg.sender == TokenInterface(gearsAddress).ownerOf(tokenIds[i]), "you are not gear owner");
      ( , , uint256 category, , , ) = IGears(gearsAddress).gears(tokenIds[i]);
      require(category != CATEGORY_TRANSPORT, "can not lock transport");
      require(!isGearCategoryChoosenBefore(choosenCategories, category), "you can't lock gears of the same category");
      choosenCategories[i] = category;
    }


    // unlock prev locked transport and gear
    GearLocks memory prevLockedGears = gearLocks[msg.sender];

    if (prevLockedGears.set) {
      if (prevLockedGears.transportId > 0) {
        IGears(gearsAddress).unlockGear(prevLockedGears.transportId);
      }

      for (uint i = 0; i < prevLockedGears.gearsId.length; i++) {
        IGears(gearsAddress).unlockGear(prevLockedGears.gearsId[i]);
      }
    }

    // lock current gears

    if (transportId > 0) {
      IGears(gearsAddress).lockGear(transportId);
    }

    for (uint i = 0; i < tokenIds.length; i++) {
      IGears(gearsAddress).lockGear(tokenIds[i]);
    }

    // update state by rewrite
    gearLocks[msg.sender] = GearLocks(transportId, tokenIds, true);
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

}
