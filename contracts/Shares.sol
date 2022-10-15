// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './Constants.sol';
import './interfaces/IShares.sol';
import './interfaces/IDependencies.sol';

abstract contract Shares is IShares, Constants {
  uint64 constant startCLNYDate = 1655391600; // 16 Jun 2022 14:30UTC - public launch
  uint256 public maxLandShares; // shares of land with max shares

  IDependencies public d; // dependencies

  uint256[17] private ______gap;

  uint256 reserved0_0;

  struct LandInfo {
    uint256 share;
    uint256 rewardDebt;
  }
  uint256 public lastRewardTime;
  uint256 public accColonyPerShare;
  uint256 public clnyPerSecond;
  uint256 public totalShare;
  mapping(uint256 => LandInfo) public landInfo;

  // to add variables here reduce `______gm_gap_0` in GameManager

  // Update reward variables to be up-to-date.
  function updatePool() internal {
    if (block.timestamp <= lastRewardTime) {
      return;
    }
    if (totalShare == 0) {
      lastRewardTime = block.timestamp;
      return;
    }
    uint256 clnyReward = (block.timestamp - lastRewardTime) * clnyPerSecond;
    accColonyPerShare = accColonyPerShare + (clnyReward * 1e12) / totalShare;
    lastRewardTime = block.timestamp;
  }

  function setInitialShare(uint256 tokenId) internal {
    landInfo[tokenId].share = 1;
    landInfo[tokenId].rewardDebt = accColonyPerShare / 1e12;
    totalShare = totalShare + 1;
  }

  function addToShare(uint256 tokenId, uint256 _share, bool active) internal {
    active; // TODO use it
    LandInfo storage land = landInfo[tokenId];
    uint256 _accColonyPerShare = accColonyPerShare;
    if (block.timestamp > lastRewardTime && totalShare != 0) {
      uint256 clnyReward = (block.timestamp - lastRewardTime) * clnyPerSecond;
      _accColonyPerShare = _accColonyPerShare + (clnyReward * 1e12) / totalShare;
    }
    uint256 earned = (land.share * _accColonyPerShare) / 1e12 - land.rewardDebt;
    totalShare = totalShare + _share;
    updatePool();
    land.share = land.share + _share;
    land.rewardDebt = (land.share * accColonyPerShare) / 1e12 - earned;
    if (land.share > maxLandShares) {
      maxLandShares = land.share;
    }
  }
}
