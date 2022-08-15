// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './ILootboxes.sol';

interface IGears {
  enum Rarity{ COMMON, RARE, LEGENDARY }
  function mint(address user, ILootboxes.Rarity rarity) external;
  function setBaseURI(string memory newURI) external;
  function lockGear(uint256 tokenId) external;
  function unlockGear(uint256 tokenId) external;
}
