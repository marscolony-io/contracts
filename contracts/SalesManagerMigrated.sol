// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import './interfaces/ISalesManager.sol';


contract SalesManagerMigrated is ISalesManager {
  function mcTransferHook(address from, address to, uint256 tokenId) external {
    from;
    to;
    tokenId;
    revert('Old legacy contract. Land plots NFT migrated to 0x3B45B2AEc65A4492B7bd3aAd7d9Fa8f82B79D4d0');
  }
}
