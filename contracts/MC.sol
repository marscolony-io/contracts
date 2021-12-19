/**
 * Seeing this? Hi! :)
 * https://github.com/marscolony-io/contracts
 * Pls star the repo :)
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import './ERC721Enumerable.sol';
import './GameConnection.sol';
import '@openzeppelin/contracts/security/Pausable.sol';


contract MC is ERC721Enumerable, GameConnection, Pausable {
  string private nftBaseURI = '';

  constructor (
    address _DAO,
    string memory _nftBaseURI
  ) ERC721('MarsColony', 'MC') GameConnection(_DAO) {
    nftBaseURI = _nftBaseURI;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return nftBaseURI;
  }

  function setBaseURI(string memory newURI) external onlyDAO whenNotPaused {
    nftBaseURI = newURI;
  }

  function mint(address receiver, uint256 tokenId) external onlyGameManager whenNotPaused {
    _safeMint(receiver, tokenId);
  }

  function pause() external onlyGameManager {
    _pause();
  }

  function unpause() external onlyGameManager {
    _unpause();
  }

  function allTokens() external view returns(uint256[] memory) {
    return _allTokens;
  }

  function allMyTokens() external view returns(uint256[] memory) {
    uint256 tokenCount = balanceOf(msg.sender);
    if (tokenCount == 0) {
      return new uint256[](0);
    } else {
      uint256[] memory result = new uint256[](tokenCount);
      for (uint256 i = 0; i < tokenCount; i++) {
        result[i] = tokenOfOwnerByIndex(msg.sender, i);
      }
      return result;
    }
  }

  // // only for tests
  // function dayBack(uint256 tokenId) external onlyTokenOwner(tokenId) {
  //   lastCLNYCheckout[tokenId] = lastCLNYCheckout[tokenId] - 10 * 60 * 60 * 24;
  // }
}
