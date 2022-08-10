// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './interfaces/IGameManager.sol';
import './interfaces/IShares.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import './interfaces/ICLNY.sol';

contract LandStats {
  struct PointAndLevel {
    uint8 level;
    uint32 x;
    uint32 y;
  }

  struct LandInfo {
    bool owned;
    address owner;
    uint256 earned;
    uint256 speed;
    PointAndLevel baseStation;
    PointAndLevel transport;
    PointAndLevel robotAssembly;
    PointAndLevel powerProduction;
  }

  struct ClnyStat {
    uint256 burned;
    uint256 minted;
    uint256 avg;
    uint256 max;
  }

  IGameManager public GameManager;

  constructor (
    IGameManager _GameManager
  ) {
    GameManager = _GameManager;
  }

  function getLandData(uint256[] calldata tokenIds) external view returns (LandInfo[] memory) {
    IGameManager.AttributeData[] memory attributes = new IGameManager.AttributeData[](tokenIds.length);
    attributes = GameManager.getAttributesMany(tokenIds);
    LandInfo[] memory data = new LandInfo[](tokenIds.length);
    for (uint256 i = 0; i < tokenIds.length; i++) {
      data[i].owner = ERC721Enumerable(GameManager.MCAddress()).ownerOf(tokenIds[i]);
      data[i].owned = data[i].owner == msg.sender;
      data[i].earned = attributes[i].earned;
      data[i].speed = attributes[i].speed;
      data[i].baseStation.level = attributes[i].baseStation;
      (uint32 x, uint32 y, ) = GameManager.baseStationsPlacement(tokenIds[i]);
      data[i].baseStation.x = x;
      data[i].baseStation.y = y;
      data[i].transport.level = attributes[i].transport;
      (x, y, ) = GameManager.transportPlacement(tokenIds[i]);
      data[i].transport.x = x;
      data[i].transport.y = y;
      data[i].robotAssembly.level = attributes[i].robotAssembly;
      (x, y, ) = GameManager.robotAssemblyPlacement(tokenIds[i]);
      data[i].robotAssembly.x = x;
      data[i].robotAssembly.y = y;
      data[i].powerProduction.level = attributes[i].powerProduction;
      (x, y, ) = GameManager.powerProductionPlacement(tokenIds[i]);
      data[i].powerProduction.x = x;
      data[i].powerProduction.y = y;
    }
    return data;
  }

  function gelClnyStat() external view returns (ClnyStat memory result) {
    uint256 colonyDaySupply = IShares(address(GameManager)).clnyPerSecond() * 24 * 60 * 60;
    uint256 landsClaimed = ERC721Enumerable(GameManager.MCAddress()).totalSupply();
    uint256 totalShare = IShares(address(GameManager)).totalShare();
    uint256 maxLandShares = IShares(address(GameManager)).maxLandShares();

    for (uint256 reason = 0; reason <= 150; reason++) {
      result.burned += ICLNY(GameManager.CLNYAddress()).burnedStats(reason);
      result.minted += ICLNY(GameManager.CLNYAddress()).mintedStats(reason);
    }
    
    result.avg = colonyDaySupply / landsClaimed;
    result.max = ( colonyDaySupply / totalShare ) * maxLandShares;
    return result;
  }
}
