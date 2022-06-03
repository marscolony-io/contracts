// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './GameConnection.sol';
import './interfaces/IMartianColonists.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/ICryochamber.sol';



contract AvatarManager is GameConnection, PausableUpgradeable {
  uint256 public maxTokenId;

  IMartianColonists public collection;
  mapping (uint256 => uint256) private xp;

  ICryochamber public cryochambers;

  uint256[48] private ______mc_gap;

  function initialize(address _DAO, address _collection) external initializer {
    GameConnection.__GameConnection_init(_DAO);
    PausableUpgradeable.__Pausable_init();
    maxTokenId = 5;
    collection = IMartianColonists(_collection);
  }

  function setCryochamberManager(address cryochamberManager) external {
    cryochambers = ICryochamber(cryochamberManager);
  }

  function _getXP(uint256 avatarId) private view returns(uint256) {
    return xp[avatarId] + 100; // 100 is a base for every avatar
  }

  function getXP(uint256[] memory avatarIds) public view returns(uint256[] memory) {
    uint256[] memory result = new uint256[](avatarIds.length);

    for (uint256 i = 0; i < avatarIds.length; i++) {
      
      result[i] = _getXP(avatarIds[i]);

      ICryochamber.CryoTime memory cryo = cryochambers.cryos(avatarIds[i]);
      
      if (cryochambers.isAvatarCryoFinished(cryo)) {
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

  function getNames(uint256[] calldata tokenIds) external view returns (string[] memory) {
    string[] memory result = new string[](tokenIds.length);
    for (uint256 i = 0; i < tokenIds.length; i++) {
      result[i] = collection.names(tokenIds[i]);
    }
    return result;
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyDAO {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }

  modifier onlyCryochamberManager {
    require(msg.sender == address(cryochambers), 'Only CryochamberManager');
    _;
  }
}
