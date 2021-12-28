/**
 * ERC721 MC token - land plots
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import './ERC721EnumerableUpgradeable.sol';
import './GameConnection.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';


contract MC is ERC721EnumerableUpgradeable, GameConnection, PausableUpgradeable {
  string private nftBaseURI;
  mapping (uint256 => string) private names;

  function initialize(address _DAO, string memory _nftBaseURI) public initializer {
    ERC721EnumerableUpgradeable.__ERC721Enumerable_init();
    __ERC721_init('MarsColony', 'MC');
    GameConnection.__GameConnection_init(_DAO);
    PausableUpgradeable.__Pausable_init();
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

  function setName(uint256 tokenId, string memory _name) external {
    require (ownerOf(tokenId) == msg.sender, 'Not your token');
    names[tokenId] = _name;
  }

  function getName(uint256 tokenId) external view returns (string memory) {
    return names[tokenId];
  }

  // // only for tests
  // function dayBack(uint256 tokenId) external onlyTokenOwner(tokenId) {
  //   lastCLNYCheckout[tokenId] = lastCLNYCheckout[tokenId] - 10 * 60 * 60 * 24;
  // }
}
