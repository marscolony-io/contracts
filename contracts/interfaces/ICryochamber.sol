// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface ICryochamber {
  struct CryoTime {
    uint64 endTime;
  }

  function purchase(address user) external;
  function getCryochamberPrice() external returns (uint256);
  function purchaseCryochamberEnergy(address user, uint256 _energyAmount) external;
  function getEnergyPrice() external view returns (uint256);
  function getAvatarCryos(uint256 avatarId) external view returns (CryoTime[] memory);
  function getCryoXpAddition() external view returns (uint256);
}