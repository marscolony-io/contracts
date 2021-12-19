// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './DAOOwnership.sol';

contract GameConnection is DAOOwnership {
  address public GameManager;

  constructor (address _DAO) DAOOwnership(_DAO) { }

  modifier onlyGameManager {
    require(msg.sender == GameManager, 'Only GameManager');
    _;
  }

  function setGameManager(address _GameManager) external onlyDAO {
    GameManager = _GameManager;
  }
}
