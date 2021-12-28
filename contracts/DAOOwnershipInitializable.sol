// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


abstract contract DAOOwnershipInitializable {
  address public DAO;

  modifier onlyDAO {
    require(msg.sender == DAO, 'Only DAO');
    _;
  }

  // TODO test transferDAO
  function transferDAO(address _DAO) external onlyDAO {
    DAO = _DAO;
  }
}
