/**
 * ERC20 CLNY token
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import './GameConnection.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';


contract CLNY is ERC20, GameConnection, Pausable {
  constructor (address _DAO) ERC20('ColonyToken', 'CLNY') {
    GameConnection.__GameConnection_init(_DAO);
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

  /** for generating royalties after burning larger amount like in avatars */
  function mint(address _address, uint256 _amount, uint256 reason) external onlyGameManager whenNotPaused {
    _mint(_address, _amount);
    burnedStats[reason] -= _amount;
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
