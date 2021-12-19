// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import './GameConnection.sol';
import '@openzeppelin/contracts/security/Pausable.sol';


contract CLNY is ERC20, GameConnection, Pausable {
  constructor (address _DAO) ERC20('ColonyToken', 'CLNY') GameConnection(_DAO) { }

  function burn(address _address, uint256 _amount) external onlyGameManager whenNotPaused {
    _burn(_address,  _amount);
  }

  function mint(address _address, uint256 _amount) external onlyGameManager whenNotPaused {
    _mint(_address,  _amount);
  }

  function pause() external onlyGameManager {
    _pause();
  }

  function unpause() external onlyGameManager {
    _unpause();
  }
}
