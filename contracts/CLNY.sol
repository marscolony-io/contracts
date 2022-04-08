/**
 * ERC20 CLNY token
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import './GameConnection.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';


contract CLNY is ERC20Upgradeable, GameConnection, PausableUpgradeable {
  function initialize(address _DAO) public initializer {
    GameConnection.__GameConnection_init(_DAO);
    PausableUpgradeable.__Pausable_init();
    ERC20Upgradeable.__ERC20_init('ColonyToken', 'CLNY');
  }

  mapping (uint256 => uint256) public burnedStats;

  uint256[49] private ______clny_gap;

  function burn(address _address, uint256 _amount) external onlyGameManager whenNotPaused {
    _burn(_address, _amount);
  }

  function burn(address _address, uint256 _amount, uint256 reason) external onlyGameManager whenNotPaused {
    _burn(_address, _amount);
    burnedStats[reason] += _amount;
  }

  // to migrate with historical data - see getBurnedOnEnhancements in GameManager
  function setBurned(uint16 reason, uint256 amount) external onlyDAO {
    burnedStats[reason] = amount;
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

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyDAO {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }
}
