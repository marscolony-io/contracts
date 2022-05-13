// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './GameConnection.sol';
import './interfaces/IMartianColonists.sol';
import './interfaces/IAvatarManager.sol';
import './interfaces/IGameManager.sol';
import './interfaces/NFTMintableInterface.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';


contract MissionManager is GameConnection, PausableUpgradeable {
  IMartianColonists public collection;
  IAvatarManager public avatarManager;
  NFTMintableInterface public MC;

  struct AccountMissionState {
    bool isAccountPrivate; // don't allow missions on my lands
  }

  struct LandMissionState {
    uint256 missionNonce; // orchestrated by the backend, included in signatures
  }

  mapping (address => AccountMissionState) public accountMissionState;
  mapping (uint256 => LandMissionState) public landMissionState;
  // TODO avatarMissionState?

  struct LandMissionData { 
    uint256 availableMissionCount;
    address owner;
    bool isPrivate;
  }

  uint256[49] private ______gap;

  function initialize(address _DAO, address _collection, address _avatarManager, address _MC) external initializer {
    GameConnection.__GameConnection_init(_DAO);
    PausableUpgradeable.__Pausable_init();
    collection = IMartianColonists(_collection);
    avatarManager = IAvatarManager(_avatarManager);
    MC = NFTMintableInterface(_MC);
  }

  function setAccountPrivacy(bool _isPrivate) external {
    accountMissionState[msg.sender].isAccountPrivate = _isPrivate;
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
