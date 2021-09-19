// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import './MarsDAO.sol';

/**
 * A contract to store game and user data in NFT tokens for a future gamification
 */
contract MarsStorage is MarsDAO {
  mapping (uint256 => string) internal _userStore;
  mapping (uint256 => string) private _gameStore;
  mapping (uint256 => uint16) private _gameState; // 16 bits of toggles

  // contract/wallet, which is able to set gameValue
  address public GameDispatcher = address(0);

  constructor (address _DAO) MarsDAO(_DAO) { }

  event UserData(address indexed from, uint256 indexed tokenId, string data);
  event GameData(address indexed dispatcher, uint256 indexed tokenId, string data);
  event GameState(address indexed dispatcher, uint256 indexed tokenId, uint16 indexed result);

  event ChangeDispatcher(address indexed dispatcher);

  function storeGameValue(uint256 tokenId, string memory data) external {
    require(GameDispatcher == msg.sender, 'Only dispather can store game values');
    _gameStore[tokenId] = data;
    emit GameData(msg.sender, tokenId, data);
  }

  function toggleGameState(uint256 tokenId, uint16 toggle) external {
    require(GameDispatcher == msg.sender, 'Only dispather can toggle game state');
    _gameState[tokenId] = _gameState[tokenId] ^ toggle;
    emit GameState(msg.sender, tokenId, _gameState[tokenId]);
  }

  function setGameDispatcher(address _GameDispatcher) external {
    GameDispatcher = _GameDispatcher;
    emit ChangeDispatcher(_GameDispatcher);
  }

  function getUserValue(uint256 tokenId) public view returns (string memory) {
    return _userStore[tokenId];
  }

  function getGameValue(uint256 tokenId) public view returns (string memory) {
    return _gameStore[tokenId];
  }

  function getGameState(uint256 tokenId) public view returns (uint16) {
    return _gameState[tokenId];
  }
}
