// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IMC {
  function pause() external;

  function unpause() external;

  function mint(address receiver, uint256 tokenId) external;
}
