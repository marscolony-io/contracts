// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './IEnums.sol';

interface ICollectionManager {
  function addXP(uint256 avatarId, uint256 increment) external;
  function addXPAfterCryo(uint256 avatarId, uint256 increment) external;
  function getXP(uint256[] memory avatarIds) external view returns(uint256[] memory);
  function setNameByGameManager(uint256 tokenId, string memory _name) external;
  function setLocks(uint256[] calldata tokenIds) external;
  function mintGear(address owner, IEnums.Rarity rarity) external;
}
