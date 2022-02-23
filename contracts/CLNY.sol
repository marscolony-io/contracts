/**
 * ERC20 CLNY token
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import './GameConnection.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';


contract CLNY is ERC20Upgradeable, GameConnection, PausableUpgradeable {
  function initialize(address _DAO) public initializer {
    GameConnection.__GameConnection_init(_DAO);
    PausableUpgradeable.__Pausable_init();
    ERC20Upgradeable.__ERC20_init('ColonyToken', 'CLNY');
  }

  uint256[50] private ______clny_gap;

  // TODO total supply logic and limitations

  function burn(address _address, uint256 _amount) external onlyGameManager whenNotPaused {
    _burn(_address, _amount);
  }

  function mint(address _address, uint256 _amount) external onlyGameManager whenNotPaused {
    _mint(_address, _amount);
  }

  function pause() external onlyGameManager {
    _pause();
  }

  function unpause() external onlyGameManager {
    _unpause();
  }
}
