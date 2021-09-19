// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * A contract for a DAO address - to it set only in constructor and to make it able to withdraw
 */
contract MarsDAO {
  // we use gnosis
  address public DAO;

  constructor (address _DAO) {
    DAO = _DAO;
  }

  // anyone can call, but the withdraw is only to the DAO address
  function withdraw() external {
    require (address(this).balance != 0, 'Nothing to withdraw');
    (bool success, ) = payable(DAO).call{ value: address(this).balance }('');
    require(success, 'Transfer failed');
  }

  // anyone can call, but the withdraw is only to the DAO address
  function withdrawValue(uint256 value) external {
    require (address(this).balance != 0, 'Nothing to withdraw');
    (bool success, ) = payable(DAO).call{ value: value }('');
    require(success, 'Transfer failed');
  }
}
