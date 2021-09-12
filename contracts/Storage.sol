// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ERC721.sol";

contract Storage {
  mapping (uint256 => string) private _userStore;
  mapping (uint256 => string) private _gameStore;

  function _storeUserValue(uint256 tokenId, string memory data) internal {
    _userStore[tokenId] = data;
  }

    function _storeGameValue(uint256 tokenId, string memory data) internal {
    _gameStore[tokenId] = data;
  }

  function getUserValue(uint256 tokenId) public view returns (string memory) {
    return _userStore[tokenId];
  }

  function getGameValue(uint256 tokenId) public view returns (string memory) {
    return _gameStore[tokenId];
  }
}
