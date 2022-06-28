// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './GameConnection.sol';
import './interfaces/IMartianColonists.sol';
import './interfaces/IAvatarManager.sol';
import './interfaces/IGameManager.sol';
import './interfaces/TokenInterface.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';


contract MissionManager is GameConnection, PausableUpgradeable {
  IMartianColonists public collection;
  IAvatarManager public avatarManager;
  TokenInterface public MC;

  struct AccountMissionState {
    bool isAccountPrivate; // don't allow missions on my lands
    uint8 revshare;
  }

  mapping (address => AccountMissionState) public accountMissionState;

  struct LandMissionData { 
    uint256 availableMissionCount;
    address owner;
    bool isPrivate;
  }

  uint256[50] private ______gap;

  function initialize(address _DAO, address _collection, address _avatarManager, address _MC) external initializer {
    GameConnection.__GameConnection_init(_DAO);
    PausableUpgradeable.__Pausable_init();
    collection = IMartianColonists(_collection);
    avatarManager = IAvatarManager(_avatarManager);
    MC = TokenInterface(_MC);
  }

  function setAccountPrivacy(bool _isPrivate) external {
    accountMissionState[msg.sender].isAccountPrivate = _isPrivate;
  }
  
  function setAccountRevshare(uint8 _revshare) external {
    require(_revshare >= 1, "Revshare value is too low, 1 is min");
    require(_revshare <= 99, "Revshare value is too high, 99 is max");
    accountMissionState[msg.sender].revshare = _revshare;
  }

  function _calculateLandMissionsLimits(uint256 landId) private view returns (uint256 availableMissionCount) {
    uint256[] memory landIds = new uint256[](1);
    landIds[0] = landId;
    IGameManager  gameManager = IGameManager(GameManager);
    IGameManager.AttributeData memory landAttributes = gameManager.getAttributesMany(landIds)[0];

    if (landAttributes.baseStation == 0) {
      return 0;
    }

    return 1 + landAttributes.powerProduction;      
  }

  function getRevshare(address _address) view external returns (uint8 revShare) {
    revShare = accountMissionState[_address].revshare;
    if (revShare == 0) {
      revShare = 20;
    }
    return revShare;
  } 

  function _getAvailableMissions(uint256 landId) private view returns (LandMissionData memory) {
    address landOwner = MC.ownerOf(landId);
    bool isPrivate = accountMissionState[landOwner].isAccountPrivate;
    uint256 availableMissionCount = _calculateLandMissionsLimits(landId);

    return LandMissionData(
      availableMissionCount,
      landOwner,
      isPrivate 
    );
  }

  function getAvailableMissions(uint256[] memory landId) external view returns (LandMissionData[] memory) {
    if (landId.length == 0) {
      return new LandMissionData[](0);
    } else {
      LandMissionData[] memory result = new LandMissionData[](landId.length);
      for (uint256 i = 0; i < landId.length; i++) {
        result[i] = _getAvailableMissions(landId[i]);
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

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyDAO {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }
}
