// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';



contract Oracle is Ownable {

  address[] public relayers;
  uint256 oneUsdRate;
  uint256 lastUpdateTime;

  IERC20 constant WONE = IERC20(0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a);
  IERC20 constant CLNY = IERC20(0x0D625029E21540aBdfAFa3BFC6FD44fB4e0A66d0);
  IERC20 constant SLP_CLNY = IERC20(0xcd818813F038A4d1a27c84d24d74bBC21551FA83);


  uint256 constant validityPeriod = 6 * 60 * 60 * 1000; // six hours in milliseconds
  
  modifier onlyRelayer() {
    require(isRelayerAlreadyAdded(msg.sender), "not relayer");
    _;
  }

  function isRelayerAlreadyAdded(address _relayer) private view returns (bool) {
    for (uint i = 0; i < relayers.length; i++) {
      if (relayers[i] == _relayer) {
        return true;
      }
    }
    return false;
  }

  function addRelayer(address _relayer) external onlyOwner {
    require(!isRelayerAlreadyAdded(_relayer), "relayer added already");
    relayers.push(_relayer);
  }

  function deleteRelayer(address _relayer) external onlyOwner {
    require(isRelayerAlreadyAdded(_relayer), "this address is not in relayers");
    address[] memory newRelayers = new address[](relayers.length - 1);
    uint index = 0;
    for (uint i = 0; i < relayers.length; i++) {
      if (relayers[i] != _relayer) {
        newRelayers[index] = relayers[i];
        index++;
      }
    }
    relayers = newRelayers;
  }

  function isRateValid() private view returns (bool) {
    return block.timestamp - lastUpdateTime > lastUpdateTime;
  }

  function oneInUsd() external view returns (bool valid, uint256 rate) {
    return (isRateValid(), oneUsdRate);
  }

  function hclnyInUsd() external view returns (bool valid, uint256 rate) {
    uint256 woneInLiq = WONE.balanceOf(address(SLP_CLNY));
    uint256 clnyInLiq = CLNY.balanceOf(address(SLP_CLNY));
    uint256 onePrice = woneInLiq * 1e18 / clnyInLiq;
    return (isRateValid(), onePrice * oneUsdRate);
  }

  function actualize(uint256 price) external onlyRelayer {
    oneUsdRate = price;
  }
  
}
