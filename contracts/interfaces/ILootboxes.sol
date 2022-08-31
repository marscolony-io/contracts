// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './IEnums.sol';

interface ILootboxes {
  function mint(address user, IEnums.Rarity rarity) external;
  function burn(uint256 tokenId) external;
  function setBaseURI(string memory newURI) external;
  function rarities(uint256 tokenId) external view returns (IEnums.Rarity);
}
