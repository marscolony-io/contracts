// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface ILootboxes {
  function mint(address user) external;
  function setBaseURI(string memory newURI) external;
}
