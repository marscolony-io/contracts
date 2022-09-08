// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface ICLNY is IERC20 {
  function burnedStats(uint256) external view returns (uint256);
  function mintedStats(uint256) external view returns (uint256);
  function pause() external;
  function unpause() external;
  function mint(address receiver, uint256 _amount, uint256 reason) external;
  function burn(address _address, uint256 _amount, uint256 reason) external;
}
