/**
 * ERC721 MC token - land plots
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
import './GameConnection.sol';
import './interfaces/ISalesManager.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';


contract MC is ERC721EnumerableUpgradeable, GameConnection, PausableUpgradeable {
  string private nftBaseURI;
  uint256 private reserved0; // previous: token owner can set a name for their NFT; deleted

  // 32 bytes slot start
  bool lock;
  bool migrationOpen; // false; for Polygon legacy compatibility
  ISalesManager public salesManager;
  // 10 more possible bytes
  // 32 bytes slot end

  uint256[49] private ______mc_gap;

  function initialize(string memory _nftBaseURI) public initializer {
    ERC721EnumerableUpgradeable.__ERC721Enumerable_init();
    __ERC721_init('MarsColony', 'MC');
    GameConnection.__GameConnection_init(msg.sender);
    PausableUpgradeable.__Pausable_init();
    nftBaseURI = _nftBaseURI;
  }

  // for compatibility with Polygon
  function owner() external view returns (address) {
    return DAO;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return nftBaseURI;
  }

  function setBaseURI(string memory newURI) external onlyDAO whenNotPaused {
    nftBaseURI = newURI;
  }

  function mint(address receiver, uint256 tokenId) external onlyGameManager whenNotPaused {
    require(!lock, 'locked');
    lock = true;
    _safeMint(receiver, tokenId);
    lock = false;
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

  function allMyTokensPaginate(uint256 _from, uint256 _to) external view returns(uint256[] memory) {
    uint256 tokenCount = balanceOf(msg.sender);
    if (tokenCount <= _from || _from > _to || tokenCount == 0) {
      return new uint256[](0);
    }
    uint256 to = (tokenCount - 1 > _to) ? _to : tokenCount - 1;
    uint256[] memory result = new uint256[](to - _from + 1);
    for (uint256 i = _from; i <= to; i++) {
      result[i - _from] = tokenOfOwnerByIndex(msg.sender, i);
    }
    return result;
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

  function setSalesManager(ISalesManager _address) external onlyDAO {
    salesManager = _address;
  }

  /** for the in-game marketplace */
  function trade(address _from, address _to, uint256 _tokenId) external whenNotPaused {
    require (msg.sender == address(salesManager), 'only SalesManager');
    require(!lock, 'locked');
    lock = true;
    _safeTransfer(_from, _to, _tokenId, '');
    lock = false;
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyDAO {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }
}
