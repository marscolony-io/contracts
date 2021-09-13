// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ERC721.sol";

contract Storage {
  mapping (uint256 => string) private _userStore;
  mapping (uint256 => string) private _gameStore;
  mapping (uint256 => uint16) private _gameState; // 16 bits of toggles

  event UserData(address indexed from, uint256 indexed tokenId, string data);
  event GameData(address indexed dispatcher, uint256 indexed tokenId, string data);
  event GameState(address indexed dispatcher, uint256 indexed tokenId, uint16 indexed result);

  function _storeUserValue(uint256 tokenId, string memory data) internal {
    _userStore[tokenId] = data;
    emit UserData(msg.sender, tokenId, data);
  }

  function _storeGameValue(uint256 tokenId, string memory data) internal {
    _gameStore[tokenId] = data;
    emit GameData(msg.sender, tokenId, data);
  }

  function _toggleGameState(uint256 tokenId, uint16 toggle) internal {
    _gameState[tokenId] = _gameState[tokenId] ^ toggle;
    emit GameState(msg.sender, tokenId, _gameState[tokenId]);
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
