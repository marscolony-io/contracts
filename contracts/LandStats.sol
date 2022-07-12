// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './interfaces/IGameManager.sol';
import './interfaces/IMartianColonists.sol';
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

  IMartianColonists public MC;
  IGameManager public GameManager;
  ICLNY public CLNY;

  constructor (
    IGameManager _GameManager,
    IMartianColonists _MC,
    ICLNY _CLNY
  ) {
    GameManager = _GameManager;
    MC = _MC;
    CLNY = _CLNY;
  }

  function getLandData(uint256[] calldata tokenIds) external view returns (LandInfo[] memory) {
    IGameManager.AttributeData[] memory attributes = new IGameManager.AttributeData[](tokenIds.length);
    attributes = GameManager.getAttributesMany(tokenIds);
    LandInfo[] memory data = new LandInfo[](tokenIds.length);
    for (uint256 i = 0; i < tokenIds.length; i++) {
      data[i].owner = IMartianColonists(MC).ownerOf(tokenIds[i]);
      data[i].owned = data[i].owner == msg.sender;
      data[i].earned = attributes[i].earned;
      data[i].speed = attributes[i].speed;
      data[i].baseStation.level = attributes[i].baseStation;
      IGameManager.PlaceOnLand memory bsPlace = GameManager.baseStationsPlacement(tokenIds[i]);
      data[i].baseStation.x = bsPlace.x;
      data[i].baseStation.y = bsPlace.y;
      data[i].transport.level = attributes[i].transport;
      IGameManager.PlaceOnLand memory tPlace = GameManager.transportPlacement(tokenIds[i]);
      data[i].transport.x = tPlace.x;
      data[i].transport.y = tPlace.y;
      data[i].robotAssembly.level = attributes[i].robotAssembly;
      IGameManager.PlaceOnLand memory raPlace = GameManager.robotAssemblyPlacement(tokenIds[i]);
      data[i].robotAssembly.x = raPlace.x;
      data[i].robotAssembly.y = raPlace.y;
      data[i].powerProduction.level = attributes[i].powerProduction;
      IGameManager.PlaceOnLand memory ppPlace = GameManager.powerProductionPlacement(tokenIds[i]);
      data[i].powerProduction.x = ppPlace.x;
      data[i].powerProduction.y = ppPlace.y;
    }
    return data;
  }

  function gelClnyStat() external view returns (ClnyStat memory result) {

    uint256 colonyDaySupply = GameManager.clnyPerSecond() * 24 * 60 * 60;
    uint256 landsClaimed = MC.totalSupply();
    uint256 totalShare = GameManager.totalShare();
    uint256 maxLandShares = GameManager.maxLandShares();

    for (uint256 reason = 0; reason <= 99; reason++) {
      result.burned += CLNY.burnedStats(reason);
      result.minted += CLNY.mintedStats(reason);
    }
    
    result.avg = colonyDaySupply / landsClaimed;
    result.max = ( colonyDaySupply / totalShare ) * maxLandShares;
    return result;
  }
}