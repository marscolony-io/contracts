// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


interface ISalesManager {
  function mcTransferHook(address from, address to, uint256 tokenId) external;
}
