// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';

interface IMartianColonists is IERC721Enumerable {
  function setAvatarManager(address _avatarManager) external;
  function setBaseURI(string memory newURI) external;
  function mint(address receiver) external;
  function setName(uint256 tokenId, string memory _name) external;
  function names(uint256) external view returns (string memory);
}
