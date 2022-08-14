// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface ILootboxes {
  enum Rarity{ COMMON, RARE, LEGENDARY }
  function mint(address user, Rarity rarity) external;
  function burn(uint256 tokenId) external;
  function setBaseURI(string memory newURI) external;
  function opened(uint256 tokenId) external returns (bool);
  function open(uint256 tokenId) external;
  function rarities(uint256 tokenId) external view returns (Rarity);
}
