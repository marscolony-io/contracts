// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/utils/Strings.sol";
import './interfaces/ILootboxes.sol';


contract Lootboxes is ERC721Enumerable, ILootboxes, Ownable {
  using Strings for uint256;

  string private nftBaseURI;
  address public gameManager;
  mapping (uint256 => bool) public opened;
  mapping (uint256 => Rarity) public rarities;
  bool lock;

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

  function getRarityUriPath(Rarity _rarity) private pure returns (string memory) {
    if (_rarity == Rarity.COMMON) return"/0/";
    if (_rarity == Rarity.UNCOMMON) return"/1/";
    if (_rarity == Rarity.RARE) return"/2/";
    if (_rarity == Rarity.LEGENDARY) return"/3/";
    revert("Invalid rarity");
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

    string memory baseURI = _baseURI();
    Rarity rarity = rarities[tokenId];
    return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), getRarityUriPath(rarity))) : "";
  }

  function mint(address receiver, Rarity _rarity) external override onlyGameManager {
    require(!lock, 'locked');
    lock = true;
    uint256 tokenId = ERC721Enumerable.totalSupply() + 1;
    rarities[tokenId] = _rarity;
    _safeMint(receiver, tokenId); // +1 because we emit 0 and start with 1
    lock = false;
  }


  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyOwner {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }

  function open(uint256 tokenId) external onlyGameManager {
    opened[tokenId] = true;
  }
}
