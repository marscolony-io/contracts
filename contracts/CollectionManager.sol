// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './GameConnection.sol';
import './interfaces/IMartianColonists.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/ICryochamber.sol';
import './interfaces/ICollectionManager.sol';
import './interfaces/ILootboxes.sol';
import './interfaces/IEnums.sol';
import './interfaces/IGears.sol';
import './interfaces/TokenInterface.sol';


contract CollectionManager is ICollectionManager, GameConnection, PausableUpgradeable {
  uint256 public maxTokenId;

  IMartianColonists public collection;
  mapping (uint256 => uint256) private xp;

  ICryochamber public cryochambers;
  address public gearsAddress;

  struct GearLocks {
    uint256 transportId;
    uint256[] gearsId;
  }

  mapping (address => GearLocks) gearLocks;


  uint256[47] private ______mc_gap;

  modifier onlyCryochamberManager {
    require(msg.sender == address(cryochambers), 'Only CryochamberManager');
    _;
  }

  function initialize(address _collection) external initializer {
    GameConnection.__GameConnection_init(msg.sender);
    PausableUpgradeable.__Pausable_init();
    maxTokenId = 0;
    collection = IMartianColonists(_collection);
  }

  function setCryochamberManager(address cryochamberManager) external {
    cryochambers = ICryochamber(cryochamberManager);
  }

   function setGearsAddress(address _address) external onlyDAO {
    gearsAddress = _address;
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

  function isGearCategoryChoosenBefore(uint256[] memory categories, uint256 category) private view returns (bool) {
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
      IGears.Gear memory transport = IGears(gearsAddress).gears(transportId); 
      require(transport.category == 4, "transportId is not transport");

      require(msg.sender == TokenInterface(gearsAddress).ownerOf(transportId), "you are not transport owner");
      require(tokenIds.length <= 3, "you can't lock so many gears");
    }

    // can not lock gears of the same categories
    uint256[] memory choosenCategories;
    for (uint i = 0; i < tokenIds.length; i++) {
      require(msg.sender == TokenInterface(gearsAddress).ownerOf(tokenIds[i]), "you are not gear owner");
      IGears.Gear memory gear = IGears(gearsAddress).gears(tokenIds[i]);
      require(isGearCategoryChoosenBefore(choosenCategories, gear.category), "you can't lock gears of the same category");
      choosenCategories[i] = gear.category;
    }

    // update state by rewrite
    gearLocks[msg.sender] = GearLocks(transportId, tokenIds);
  }

  function mintGear(address owner, IEnums.Rarity rarity) external onlyGameManager {
    IGears(gearsAddress).mint(owner, rarity);
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyDAO {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }
}
