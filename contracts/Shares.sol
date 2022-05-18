// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import './interfaces/MintBurnInterface.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

abstract contract Shares {
  struct LandInfo {
    uint256 share;
    uint256 rewardDebt;
  }
  uint256 public lastRewardTime;
  uint256 public accColonyPerShare;
  uint256 public clnyPerSecond;
  uint256 public totalShare;
  mapping (uint256 => LandInfo) public landInfo;

  // Update reward variables to be up-to-date.
  function updatePool(address CLNYAddress) public {
    if (block.timestamp <= lastRewardTime) {
      return;
    }
    if (totalShare == 0) {
      lastRewardTime = block.timestamp;
      return;
    }
    uint256 clnyReward = (block.timestamp - lastRewardTime) * clnyPerSecond;
    accColonyPerShare = accColonyPerShare + clnyReward * 1e12 / totalShare;
    lastRewardTime = block.timestamp;
    MintBurnInterface(CLNYAddress).mint(address(this), clnyReward, 100); // TODO to const
  }

  function setInitialShare(uint256 tokenId) internal {
    landInfo[tokenId].share = 1;
    totalShare = totalShare + 1;
  }

  function addToShare(uint256 tokenId, uint256 _share, address CLNYAddress) internal {
    LandInfo storage land = landInfo[tokenId];
    totalShare = totalShare + _share;
    updatePool(CLNYAddress);
    land.share = land.share + _share;
    land.rewardDebt = land.share * accColonyPerShare / 1e12;
  }

  function getShare(uint256 tokenId) external view returns (uint256) {
    return landInfo[tokenId].share;
  }

  // Safe CLNY transfer function, just in case if pool doesn't have enough CLNY (impossible though)
  function safeClnyTransfer(address _to, uint256 _amount, IERC20 CLNY) internal {
    uint256 clnyBal = CLNY.balanceOf(address(this));
    bool result = false;
    if (_amount > clnyBal) {
      result = CLNY.transfer(_to, clnyBal);
    } else {
      result = CLNY.transfer(_to, _amount);
    }
    require(result, 'transfer failed');
  }

  function claimClny(uint256 tokenId, address CLNY) internal {
    LandInfo storage land = landInfo[tokenId];
    updatePool(CLNY);
    uint256 pending = land.share * accColonyPerShare / 1e12 - land.rewardDebt;
    land.rewardDebt = (land.share * accColonyPerShare) / 1e12;
    safeClnyTransfer(msg.sender, pending, IERC20(CLNY));
  }

  // View function to see pending ColonyToken on frontend.
  /* 0xe9387504 */
  function getEarned(uint256 landId) public view returns (uint256) {
    LandInfo storage land = landInfo[landId];
    uint256 _accColonyPerShare = accColonyPerShare;
    if (block.timestamp > lastRewardTime && totalShare != 0) {
      uint256 clnyReward = (block.timestamp - lastRewardTime) * clnyPerSecond;
      _accColonyPerShare = _accColonyPerShare + clnyReward * 1e12 / totalShare;
    }
    return land.share * _accColonyPerShare / 1e12 - land.rewardDebt;
  }
}
