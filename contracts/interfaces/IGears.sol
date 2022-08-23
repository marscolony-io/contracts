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
    bool set;
  }


  function mint(address receiver, IEnums.Rarity rarity, uint256 gearType, uint256 category, uint256 durability) external;
  function setBaseURI(string memory newURI) external;
  function lockGear(uint256 tokenId) external;
  function unlockGear(uint256 tokenId) external;
  function gears(uint256 tokenId) external returns (IEnums.Rarity, uint256, uint256, uint256, bool, bool);
}
