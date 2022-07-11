// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IGameManager {
  struct AttributeData {
    uint256 speed; // CLNY earning speed
    uint256 earned;
    uint8 baseStation; // 0 or 1
    uint8 transport; // 0 or 1, 2, 3 (levels)
    uint8 robotAssembly; // 0 or 1, 2, 3 (levels)
    uint8 powerProduction; // 0 or 1, 2, 3 (levels)
  }

  struct PlaceOnLand {
    uint32 x;
    uint32 y;
    uint32 rotate; // for future versions
  }

  function baseStationsPlacement(uint256 tokenId) external view returns (PlaceOnLand memory);
  function transportPlacement(uint256 tokenId) external view returns (PlaceOnLand memory);
  function robotAssemblyPlacement(uint256 tokenId) external view returns (PlaceOnLand memory);
  function powerProductionPlacement(uint256 tokenId) external view returns (PlaceOnLand memory);

  function getAttributesMany(uint256[] calldata tokenIds) external view returns (AttributeData[] memory);
}