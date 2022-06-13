// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface ICryochamber {
  struct CryoTime {
    uint64 endTime;
    uint256 reward;
  }
  function purchaseCryochamber(address user) external;
  function cryochamberPrice() external returns (uint256);
  function purchaseCryochamberEnergy(address user, uint256 _energyAmount) external;
  function energyPrice() external view returns (uint256);
  function getAvatarCryo(uint256 avatarId) external view returns (CryoTime memory);
  function isAvatarInCryoChamber(uint256 avatarId) external view returns (bool);
}