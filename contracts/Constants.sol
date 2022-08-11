// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

abstract contract Constants {
  // CLNY mint and burn reasons
  uint256 constant REASON_UPGRADE = 1;
  uint256 constant REASON_PLACE = 2;
  uint256 constant REASON_RENAME_AVATAR = 3;
  uint256 constant REASON_MINT_AVATAR = 4;
  uint256 constant REASON_ROYALTY = 5;
  uint256 constant REASON_EARNING = 6;
  uint256 constant REASON_TREASURY = 7;
  uint256 constant REASON_LP_POOL = 8;
  uint256 constant REASON_MISSION_REWARD = 9;
  uint256 constant REASON_PURCHASE_CRYOCHAMBER = 10;
  uint256 constant REASON_PURCHASE_CRYOCHAMBER_ENERGY = 11;
  uint256 constant REASON_OPEN_LOOTBOX = 12;

  uint256 constant REASON_SHARES_PREPARE_CLNY = 100;
}
