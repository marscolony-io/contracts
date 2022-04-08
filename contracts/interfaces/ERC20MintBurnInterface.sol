// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


interface ERC20MintBurnInterface {
  function burn(address _address, uint256 _amount, uint256 reason) external;
  function mint(address _address, uint256 _amount) external;
}
