// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/utils/Strings.sol";
import './interfaces/ILootboxes.sol';
import './interfaces/IEnums.sol';


contract Lootboxes is ERC721Enumerable, ILootboxes, Ownable {
  using Strings for uint256;

  string private nftBaseURI;
  address public gameManager;
  mapping (uint256 => IEnums.Rarity) public rarities;
  mapping (address => uint256) private lastTokenMinted;
  bool lock;

  uint256 private nextIdToMint = 1;

  modifier onlyGameManager {
    require(msg.sender == gameManager, 'only game manager');
    _;
  }

  constructor (string memory _nftBaseURI) ERC721('Utility crates', 'UCR') {
    nftBaseURI = _nftBaseURI;
  }

  function setGameManager(address _gameManager) external onlyOwner {
    gameManager = _gameManager;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return nftBaseURI;
  }

  function setBaseURI(string memory newURI) external override onlyOwner {
    nftBaseURI = newURI;
  }

  function getRarityUriPath(IEnums.Rarity _rarity) private pure returns (string memory) {
    if (_rarity == IEnums.Rarity.COMMON) return "/0/";
    if (_rarity == IEnums.Rarity.RARE) return "/1/";
    if (_rarity == IEnums.Rarity.LEGENDARY) return "/2/";
    revert("Invalid rarity");
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

    string memory baseURI = _baseURI();
    IEnums.Rarity rarity = rarities[tokenId];
    return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), getRarityUriPath(rarity))) : "";
  }

  function lastOwnedTokenURI() public view returns (string memory) {
    require (lastTokenMinted[msg.sender] != 0, "User hasn't minted any token");
    return tokenURI(lastTokenMinted[msg.sender]);
  }

  function mint(address receiver, IEnums.Rarity _rarity) external override onlyGameManager {
    require(!lock, 'locked');
    lock = true;
    rarities[nextIdToMint] = _rarity;
    lastTokenMinted[receiver] = nextIdToMint;
    _safeMint(receiver, nextIdToMint); // +1 because we emit 0 and start with 1
    nextIdToMint++;
    lock = false;
  }

  function burn(uint256 tokenId) external onlyGameManager {
    _burn(tokenId);
    rarities[tokenId] = IEnums.Rarity.COMMON;
  }

  function allMyTokensPaginate(uint256 _from, uint256 _to) external view returns(uint256[] memory, uint256[] memory) {
    uint256 tokenCount = balanceOf(msg.sender);
    if (tokenCount <= _from || _from > _to || tokenCount == 0) {
      return (new uint256[](0), new uint256[](0));
    }
    uint256 to = (tokenCount - 1 > _to) ? _to : tokenCount - 1;
    uint256[] memory result = new uint256[](to - _from + 1);
    uint256[] memory resultRarities = new uint256[](to - _from + 1);
    for (uint256 i = _from; i <= to; i++) {
      result[i - _from] = tokenOfOwnerByIndex(msg.sender, i);
      resultRarities[i - _from] = uint256(rarities[result[i - _from]]);
    }
    return (result, resultRarities);
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyOwner {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }
}
