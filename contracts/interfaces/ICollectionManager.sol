// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './IEnums.sol';

interface ICollectionManager {
  function addXP(uint256 avatarId, uint256 increment) external;

  function addXPAfterCryo(uint256 avatarId, uint256 increment) external;

  function getXP(uint256[] memory avatarIds)
    external
    view
    returns (uint256[] memory);

  function setNameByGameManager(uint256 tokenId, string memory _name) external;

  function setLocks(
    uint64 transportId,
    uint64 gear1Id,
    uint64 gear2Id,
    uint64 gear3Id
  ) external;

  function mintGear(address owner, IEnums.Rarity rarity) external;

  function getLootboxOpeningPrice()
    external
    view
    returns (
      uint256 common,
      uint256 rare,
      uint256 legendary
    );

  function pause() external;

  function unpause() external;

  function mint(address receiver) external;
}
