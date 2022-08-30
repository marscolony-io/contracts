// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IOracle {
  function oneInUsd() external view returns (bool valid, uint256 rate);
  function hclnyInUsd() external view returns (bool valid, uint256 rate);
}