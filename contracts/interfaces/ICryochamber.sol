// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface ICryochamber {
 
  function purchase(address user) external;
  function getCryochamberPrice() external returns (uint256);
}