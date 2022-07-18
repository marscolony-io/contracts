// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


interface TokenInterface {
  function mint(address receiver, uint256 tokenIdOrValue) external;
  function mint(address receiver) external;
  function burn(address _address, uint256 _amount, uint256 reason) external;
  function ownerOf(uint256 tokenId) external view returns (address owner);
}
