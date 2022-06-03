/**
 * ERC721 MC token - land plots
 */

// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/ISalesManager.sol';


contract MC is ERC721Enumerable, Pausable, ReentrancyGuard, Ownable {
  string private nftBaseURI;
  ISalesManager public salesManager;
  address public GameManager;

  constructor (string memory _nftBaseURI) ERC721('MarsColony', 'MC') {
    nftBaseURI = _nftBaseURI;
  }

  modifier onlyGameManager {
    require(msg.sender == GameManager, 'Only GameManager');
    _;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return nftBaseURI;
  }

  function setBaseURI(string memory newURI) external onlyOwner whenNotPaused {
    nftBaseURI = newURI;
  }

  function mint(address receiver, uint256 tokenId) external onlyGameManager whenNotPaused nonReentrant {
    _safeMint(receiver, tokenId);
  }

  function pause() external onlyGameManager {
    _pause();
  }

  function unpause() external onlyGameManager {
    _unpause();
  }

  function setGameManager(address _GameManager) external onlyOwner {
    GameManager = _GameManager;
  }

  function _afterTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
    super._afterTokenTransfer(from, to, tokenId);
    if (address(salesManager) != address(0)) {
      salesManager.mcTransferHook(from, to, tokenId);
    }
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
    uint256 tokenCount = ERC721Enumerable.totalSupply();
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

  function setSalesManager(ISalesManager _address) external onlyOwner {
    salesManager = _address;
  }

  /** for the in-game marketplace */
  function trade(address _from, address _to, uint256 _tokenId) external whenNotPaused nonReentrant {
    require (msg.sender == address(salesManager), 'only SalesManager');
    _safeTransfer(_from, _to, _tokenId, '');
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyOwner nonReentrant {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }
}
