// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IMC {
  function trade(address _from, address _to, uint256 _tokenId) external;
}
