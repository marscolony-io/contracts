/**
 * ERC721 MC token - land plots
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
import './GameConnection.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';


contract MC is ERC721EnumerableUpgradeable, GameConnection, PausableUpgradeable {
  string private nftBaseURI;
  mapping (uint256 => string) public names; // token owner can set a name for their NFT

  bool lockMint;

  uint256[49] private ______mc_gap;

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
    require(!lockMint, 'locked');
    lockMint = true;
    _safeMint(receiver, tokenId);
    lockMint = false;
  }

  function pause() external onlyGameManager {
    _pause();
  }

  function unpause() external onlyGameManager {
    _unpause();
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

  function allTokensPaginate(uint256 _from, uint256 _to) external view returns(uint256[] memory) {
    uint256 tokenCount = ERC721EnumerableUpgradeable.totalSupply();
    if (tokenCount <= _from || _from > _to || tokenCount == 0) {
      return new uint256[](0);
    }
    uint256 to = (tokenCount - 1 > _to) ? _to : tokenCount - 1;
    uint256[] memory result = new uint256[](to - _from + 1);
    for (uint256 i = _from; i <= to; i++) {
      result[i - _from] = tokenByIndex(i);
    }
    return result;
  }

  function setName(uint256 tokenId, string memory _name) external {
    require (ownerOf(tokenId) == msg.sender, 'Not your token');
    names[tokenId] = _name;
  }

  function getName(uint256 tokenId) external view returns (string memory) {
    return names[tokenId];
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyDAO {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }
}
