/**
 * ERC20 CLNY token
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import './GameConnection.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import './interfaces/IDependencies.sol';

contract CLNY is ERC20, Pausable {
  IDependencies public d;

  constructor(string memory tokenName, IDependencies _d) ERC20('ColonyToken', tokenName) {
    d = _d;
  }

  modifier onlyOwner() {
    require(msg.sender == d.owner(), 'Only owner');
    _;
  }

  modifier onlyGameManager() {
    require(msg.sender == address(d.gameManager()), 'Only game manager');
    _;
  }

  function setDependencies(IDependencies addr) external onlyOwner {
    d = addr;
  }

  mapping(uint256 => uint256) public burnedStats;
  mapping(uint256 => uint256) public mintedStats;

  function burn(
    address _address,
    uint256 _amount,
    uint256 reason
  ) external onlyGameManager whenNotPaused {
    _burn(_address, _amount);
    burnedStats[reason] += _amount;
  }

  function mint(
    address _address,
    uint256 _amount,
    uint256 reason
  ) external onlyGameManager whenNotPaused {
    _mint(_address, _amount);
    mintedStats[reason] += _amount;
  }

  function pause() external onlyGameManager {
    _pause();
  }

  function unpause() external onlyGameManager {
    _unpause();
  }

  function withdrawToken(
    address _tokenContract,
    address _whereTo,
    uint256 _amount
  ) external onlyOwner {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }
}
