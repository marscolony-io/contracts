// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface ISalesManager {
  function removeTokenAfterTransfer (uint256 tokenId) external;
  function buyToken(uint256 tokenId, address buyer) external payable;
}
