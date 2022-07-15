// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface ILootboxes {
  enum Rarity{ COMMON, RARE, LEGENDARY }
  function mint(address user, Rarity rarity) external;
  function setBaseURI(string memory newURI) external;
}
