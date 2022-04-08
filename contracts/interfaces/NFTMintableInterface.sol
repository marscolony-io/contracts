// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


interface NFTMintableInterface {
  function mint(address receiver, uint256 tokenId) external;
  function mint(address receiver) external;
  function ownerOf(uint256 tokenId) external view returns (address owner);
}
