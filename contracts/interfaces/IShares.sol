// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IShares {
  function maxLandShares() external view returns (uint256);
  function totalShare() external view returns (uint256);
  function clnyPerSecond() external view returns (uint256);
}
