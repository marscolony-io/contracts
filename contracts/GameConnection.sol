// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';


abstract contract GameConnection {
  address public GameManager;
  address public DAO;

  function __GameConnection_init(address _DAO) internal {
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

  // TODO test transferDAO
  function transferDAO(address _DAO) external onlyDAO {
    DAO = _DAO;
  }
}
