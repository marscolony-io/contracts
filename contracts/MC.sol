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
import "./legacy/impl/RoyaltiesV2Impl.sol";
import "./legacy/LibPart.sol";
import "./legacy/LibRoyaltiesV2.sol";


contract MC is ERC721Enumerable, Pausable, ReentrancyGuard, Ownable, RoyaltiesV2Impl {
  string private nftBaseURI;
  ISalesManager public salesManager;
  address public GameManager;
  bool migrationOpen = true;

  bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a; // royalties

  constructor (string memory _nftBaseURI) ERC721('MarsColony', 'MC') {
    nftBaseURI = _nftBaseURI;
  }

  modifier onlyGameManager {
    require(msg.sender == GameManager, 'Only GameManager');
    _;
  }

  function setRoyalties(address payable _royaltiesRecipientAddress, uint96 _percentageBasisPoints) public onlyOwner {
    LibPart.Part[] memory _royalties = new LibPart.Part[](1);
    _royalties[0].value = _percentageBasisPoints;
    _royalties[0].account = _royaltiesRecipientAddress;
    _saveRoyalties(_royalties);
  }

  function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view returns (address receiver, uint256 royaltyAmount) {
    _tokenId;
    LibPart.Part[] memory _royalties = royalty;
    if (_royalties.length > 0) {
      return (_royalties[0].account, (_salePrice * _royalties[0].value) / 10000);
    }
    return (address(0), 0);
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable) returns (bool) {
    if (interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES) {
      return true;
    }
    if (interfaceId == _INTERFACE_ID_ERC2981) {
      return true;
    }
    return super.supportsInterface(interfaceId);
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

  // is used manually to migrate tokens to a new contract, then closes onse 'close=true' is send
  function migrationMint(address[] calldata receivers, uint256[] calldata tokenIds, bool close) external onlyOwner {
    require(migrationOpen, 'Migration finished');
    require(receivers.length == tokenIds.length, 'Invalid array sizes');

    if (receivers.length > 0) {
      for (uint256 i = 0; i < receivers.length; i++) {
        _mint(receivers[i], tokenIds[i]);
      }
    }

    if (close) {
      migrationOpen = false;
    }
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

  function setSalesManager(ISalesManager _address) external onlyOwner {
    salesManager = _address;
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
