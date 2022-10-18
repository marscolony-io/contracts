// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface TokenInterface {
  function totalSupply() external view returns (uint256);

  function tokenByIndex(uint256 index) external view returns (uint256);
}
