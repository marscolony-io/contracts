// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './interfaces/IDependencies.sol';

contract Replace {

  struct Coordinates {
    IGameManager.PlaceOnLand base;
    IGameManager.PlaceOnLand transport;
    IGameManager.PlaceOnLand robot;
    IGameManager.PlaceOnLand power;
  }

  IDependencies public d;
  
  constructor (IDependencies _d) {
    d=_d;
  }

  function getCoord(uint256 tokenId) view external returns (Coordinates memory) {
    IGameManager gameManager = d.gameManager();
    IGameManager.PlaceOnLand[15] memory rightPlaces = [
      IGameManager.PlaceOnLand(6, 5, 0),
      IGameManager.PlaceOnLand(6, 3, 0),
      IGameManager.PlaceOnLand(6, 4, 0),
      IGameManager.PlaceOnLand(5, 4, 0),
      IGameManager.PlaceOnLand(5, 3, 0),
      IGameManager.PlaceOnLand(5, 2, 0),
      IGameManager.PlaceOnLand(4, 2, 0),
      IGameManager.PlaceOnLand(4, 3, 0),
      IGameManager.PlaceOnLand(3, 2, 0),
      IGameManager.PlaceOnLand(7, 3, 0),
      IGameManager.PlaceOnLand(7, 4, 0),
      IGameManager.PlaceOnLand(8, 4, 0),
      IGameManager.PlaceOnLand(8, 3, 0),
      IGameManager.PlaceOnLand(8, 2, 0),
      IGameManager.PlaceOnLand(7, 2, 0)
    ];
    bool [9][9] memory rightPlacesMatrix;
    for (uint256 i = 0; i<rightPlaces.length; i++) {
      rightPlacesMatrix[rightPlaces[i].x][rightPlaces[i].y] = true;
    }
    (uint32 baseX, uint32 baseY, ) = gameManager.baseStationsPlacement(tokenId);
    (uint32 transportX, uint32 transportY, ) = gameManager.transportPlacement(tokenId);
    (uint32 robotX, uint32 robotY, ) = gameManager.robotAssemblyPlacement(tokenId);
    (uint32 powerX, uint32 powerY, ) = gameManager.powerProductionPlacement(tokenId);
    IGameManager.PlaceOnLand[4] memory coordinates = [
      IGameManager.PlaceOnLand(baseX, baseY, 0),
      IGameManager.PlaceOnLand(transportX, transportY, 0),
      IGameManager.PlaceOnLand(robotX, robotY, 0),
      IGameManager.PlaceOnLand(powerX, powerY, 0)
    ];
    for (uint256 i = 0; i < coordinates.length; i++) {
      if (coordinates[i].x == 0 && coordinates[i].y == 0) {
        continue;
      }
      if (
        coordinates[i].x < rightPlacesMatrix.length &&
        coordinates[i].y < rightPlacesMatrix[0].length &&
        rightPlacesMatrix[coordinates[i].x][coordinates[i].y] == true
      ) {
        rightPlacesMatrix[coordinates[i].x][coordinates[i].y] = false;
      } else {
        for (uint256 j = 0; j < rightPlaces.length; j++) {
          if (rightPlacesMatrix[rightPlaces[j].x][rightPlaces[j].y] == true) {
            rightPlacesMatrix[rightPlaces[j].x][rightPlaces[j].y] = false;
            coordinates[i].x = rightPlaces[j].x;
            coordinates[i].y = rightPlaces[j].y;
            break;
          }
        }
      }
    }
    return Coordinates(coordinates[0], coordinates[1], coordinates[2], coordinates[3]);
  }
}
