// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface TokenInterface {
  function mint(address receiver, uint256 tokenId) external;
  function mint(address receiver, uint256 _amount, uint256 reason) external;
  function mint(address receiver) external;
  function burn(address _address, uint256 _amount, uint256 reason) external; // ERC20
  function ownerOf(uint256 tokenId) external view returns (address owner);
  function totalSupply() external view returns (uint256);
  function tokenByIndex(uint256 index) external view returns (uint256);
}
