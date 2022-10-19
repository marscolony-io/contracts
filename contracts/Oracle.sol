// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/IOracle.sol';

contract Oracle is Ownable, IOracle {
  address[] public relayers;
  uint256 wethUsdRate;
  uint256 lastUpdateTime;

  address weth;
  address wclny;
  address lpool;

  uint256 constant validityPeriod = 6 * 60 * 60; // six hours in seconds

  modifier onlyRelayer() {
    require(isRelayerAlreadyAdded(msg.sender), 'not relayer');
    _;
  }

  modifier onlyRelayerOrOwner() {
    require(isRelayerAlreadyAdded(msg.sender) || owner() == _msgSender(), 'neither relayer nor owner');
    _;
  }

  constructor(
    address _weth,
    address _wclny,
    address _lpool
  ) {
    weth = _weth;
    wclny = _wclny;
    lpool = _lpool;
  }

  function isRelayerAlreadyAdded(address _relayer) private view returns (bool) {
    for (uint256 i = 0; i < relayers.length; i++) {
      if (relayers[i] == _relayer) {
        return true;
      }
    }
    return false;
  }

  function addRelayer(address _relayer) external onlyOwner {
    require(!isRelayerAlreadyAdded(_relayer), 'relayer added already');
    for (uint256 i = 0; i < relayers.length; i++) {
      if (relayers[i] == address(0)) {
        relayers[i] = _relayer;
        return;
      }
    }
    relayers.push(_relayer);
  }

  function deleteRelayer(address _relayer) external onlyOwner {
    require(isRelayerAlreadyAdded(_relayer), 'this address is not in relayers');
    for (uint256 i = 0; i < relayers.length; i++) {
      if (relayers[i] == _relayer) {
        delete relayers[i];
      }
    }
  }

  function isRateValid() private view returns (bool) {
    return block.timestamp - lastUpdateTime < validityPeriod;
  }

  function wethInUsd() external view returns (bool valid, uint256 rate) {
    return (isRateValid(), wethUsdRate);
  }

  function clnyInUsd() external view returns (bool valid, uint256 rate) {
    uint256 wethInLiq = IERC20(weth).balanceOf(lpool);
    uint256 clnyInLiq = IERC20(wclny).balanceOf(lpool);
    uint256 clnyInWeth = (clnyInLiq * 1e18) / wethInLiq;
    return (isRateValid(), (clnyInWeth * wethUsdRate) / 1e18);
  }

  function actualize(uint256 price) external onlyRelayer {
    lastUpdateTime = block.timestamp;
    wethUsdRate = (1e18 * 1e18) / price;
  }

  function stop() external onlyRelayerOrOwner {
    lastUpdateTime = 0;
  }
}
