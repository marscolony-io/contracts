// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './interfaces/IDependencies.sol';
import './interfaces/IShares.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import './interfaces/IOwnable.sol';

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

  IDependencies public d;

  constructor(IDependencies _d) {
    d = _d;
  }

  function getLandData(uint256[] calldata tokenIds) external view returns (LandInfo[] memory) {
    IGameManager gm = d.gameManager();
    IGameManager.AttributeData[] memory attributes = new IGameManager.AttributeData[](tokenIds.length);
    attributes = gm.getAttributesMany(tokenIds);
    LandInfo[] memory data = new LandInfo[](tokenIds.length);
    for (uint256 i = 0; i < tokenIds.length; i++) {
      data[i].owner = IOwnable(address(d.mc())).ownerOf(tokenIds[i]);
      data[i].owned = data[i].owner == msg.sender;
      data[i].earned = attributes[i].earned;
      data[i].speed = attributes[i].speed;
      data[i].baseStation.level = attributes[i].baseStation;
      (uint32 x, uint32 y, ) = gm.baseStationsPlacement(tokenIds[i]);
      data[i].baseStation.x = x;
      data[i].baseStation.y = y;
      data[i].transport.level = attributes[i].transport;
      (x, y, ) = gm.transportPlacement(tokenIds[i]);
      data[i].transport.x = x;
      data[i].transport.y = y;
      data[i].robotAssembly.level = attributes[i].robotAssembly;
      (x, y, ) = gm.robotAssemblyPlacement(tokenIds[i]);
      data[i].robotAssembly.x = x;
      data[i].robotAssembly.y = y;
      data[i].powerProduction.level = attributes[i].powerProduction;
      (x, y, ) = gm.powerProductionPlacement(tokenIds[i]);
      data[i].powerProduction.x = x;
      data[i].powerProduction.y = y;
    }
    return data;
  }

  function gelClnyStat() external view returns (ClnyStat memory result) {
    bool sharesEconomy = d.sharesEconomy();
    if (sharesEconomy) {
      IShares gm = IShares(address(d.gameManager()));
      uint256 colonyDaySupply = gm.clnyPerSecond() * 24 * 60 * 60;
      uint256 landsClaimed = IERC721Enumerable(address(d.mc())).totalSupply();
      uint256 totalShare = gm.totalShare();
      uint256 maxLandShares = gm.maxLandShares();

      for (uint256 reason = 0; reason <= 150; reason++) {
        result.burned += d.clny().burnedStats(reason);
        result.minted += d.clny().mintedStats(reason);
      }

      result.avg = colonyDaySupply / landsClaimed;
      result.max = (colonyDaySupply / totalShare) * maxLandShares;
    }
    // else - empty result yet
  }
}
