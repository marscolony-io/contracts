// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IOracle {
  function wethInUsd() external view returns (bool valid, uint256 rate);
  function clnyInUsd() external view returns (bool valid, uint256 rate);
}