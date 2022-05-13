// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import './interfaces/ISalesManager.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';


contract SalesManager is ISalesManager, OwnableUpgradeable, PausableUpgradeable {
  address public MC;
  uint256 public saleStart;

  uint256[50] private ______gap_0;

  function initialize (address _MC) public initializer {
    __Pausable_init();
    __Ownable_init();
    MC = _MC;
  }

  function setSalesStart(uint256 timestamp) external onlyOwner {
    require (timestamp > block.timestamp, 'start time should be above now');
    saleStart = timestamp;
  }

  function setMC(address _MC) external onlyOwner {
    MC = _MC;
  }

  function mcTransferHook(address from, address to, uint256 tokenId) external {
    if (from == address(0)) {
      return; // allow mint
    }
    require (msg.sender == MC, 'wrong sender');
    require (saleStart < block.timestamp, 'transfer is locked yet');
    // nothing yet
    to;
    tokenId;
  }

}
