// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/access/Ownable.sol';

contract WETH is Ownable {
  function balanceOf(address _address) external pure returns(uint256) {
    return 2000e18; // to test clny price in liquidity pool
  }
}
