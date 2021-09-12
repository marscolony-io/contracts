pragma solidity ^0.8.0;
import "./ERC721.sol";

contract Storage {
  mapping (uint256 => string) private _store;

  function _storeValue(uint256 tokenId, string memory data) internal {
    _store[tokenId] = data;
  }

  function getValue(uint256 tokenId) public view returns (string memory) {
    return _store[tokenId];
  }
}
