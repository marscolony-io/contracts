// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/IOracle.sol';
import './interfaces/Uniswap/IUniswapV2Pair.sol';

contract OracleTestnet is Ownable, IOracle {
  function clnyInUsd() external pure returns (bool valid, uint256 rate) {
    valid = true;
    rate = 25735795044836000000;
  }
}
