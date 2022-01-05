// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


abstract contract GameConnection {
  address public GameManager;
  address public DAO;

  uint256[50] private ______gc_gap;

  function __GameConnection_init(address _DAO) internal {
    require (DAO == address(0));
    DAO = _DAO;
  }

  modifier onlyDAO {
    require(msg.sender == DAO, 'Only DAO');
    _;
  }

  modifier onlyGameManager {
    require(msg.sender == GameManager, 'Only GameManager');
    _;
  }

  function setGameManager(address _GameManager) external onlyDAO {
    GameManager = _GameManager;
  }

  function transferDAO(address _DAO) external onlyDAO {
    DAO = _DAO;
  }
}
