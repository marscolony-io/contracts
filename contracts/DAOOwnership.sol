// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract DAOOwnership {
  address public DAO;

  constructor (address _DAO) {
    DAO = _DAO;
  }

  modifier onlyDAO {
    require(msg.sender == DAO, 'Only DAO');
    _;
  }

  // TODO test transferDAO
  function transferDAO(address _DAO) external onlyDAO {
    DAO = _DAO;
  }
}
