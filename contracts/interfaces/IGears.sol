// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IGears {
  enum Rarity{ COMMON, RARE, LEGENDARY }
  enum GearType{ 
    Rocket_fuel, 
    Engine_Furious,
    WD_40,
    Titanium_drill,
    Diamond_drill,
    Laser_drill,
    Small_area_scanner,
    Medium_area_scanner,
    Large_area_scanner,
    Ultrasonic_transmitter,
    Infrared_transmitter,
    Vibration_transmitter,
    The_Nebuchadnezzar,
    Unknown
  }
  function mint(address user, Rarity rarity) external;
  function setBaseURI(string memory newURI) external;
  function lockGear(uint256 tokenId) external;
  function unlockGear(uint256 tokenId) external;
}
