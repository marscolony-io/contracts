// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './GameConnection.sol';
import './interfaces/IMartianColonists.sol';
import './interfaces/IAvatarManager.sol';
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

  uint256[50] private ______gap;

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

  function finishMission(uint256 avatar, uint256 land) external {
    require (collection.ownerOf(avatar) == msg.sender, 'wrong avatar owner');
    address landOwner = MC.ownerOf(land);
    require (
      !accountMissionState[landOwner].isAccountPrivate // public -> don't check next line
      || collection.ownerOf(avatar) == landOwner, // if account is private, owners should be same
      'mission on private account'
    ); // TODO maybe move to a modifier if we implement `startMission`
    // TODO check signature
    // TODO finish mission logic
    landMissionState[land].missionNonce = landMissionState[land].missionNonce + 1;
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
