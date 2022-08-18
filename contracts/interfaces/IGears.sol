// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './ILootboxes.sol';
import './IEnums.sol';

interface IGears {
  struct Gear {
    IEnums.Rarity rarity;
    uint256 gearType;
    uint256 category;
    uint256 durability;
    bool locked;
  }


  function mint(address user, IEnums.Rarity rarity) external;
  function setBaseURI(string memory newURI) external;
  function lockGear(uint256 tokenId) external;
  function unlockGear(uint256 tokenId) external;
  function gears(uint256 tokenId) external returns (Gear memory);
}
