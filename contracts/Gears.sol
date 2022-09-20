// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/utils/Strings.sol";
import './interfaces/IGears.sol';

contract Gears is ERC721Enumerable, Ownable, IGears {
  using Strings for uint256;

  string private nftBaseURI;
  address public collectionManager;
  mapping (uint256 => Gear) public gears;
  mapping (address => uint256) public lastTokenMinted;
  uint256 public nextIdToMint = 1;
  bool lock;


  modifier onlyCollectionManager {
    require(msg.sender == collectionManager, 'only collection manager');
    _;
  }

  modifier onlyTokenOwnerOrCollectionManager(uint256 tokenId) {
    require(msg.sender == ownerOf(tokenId) || msg.sender == collectionManager, 'only token owner or collection manager');
    _;
  }

  constructor (string memory _nftBaseURI) ERC721('Mining Mission Gear', 'MGR') {
    nftBaseURI = _nftBaseURI;
  }

  function setCollectionManager(address _collectionManager) external onlyOwner {
    collectionManager = _collectionManager;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return nftBaseURI;
  }

  function setBaseURI(string memory newURI) external override onlyOwner {
    nftBaseURI = newURI;
  }

  function getRarityUrlPath(IEnums.Rarity rarity) private pure returns (string memory) {
    if (rarity == IEnums.Rarity.COMMON) return "0";
    if (rarity == IEnums.Rarity.RARE) return "1";
    return "2";
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

    string memory baseURI = _baseURI();
    return bytes(baseURI).length > 0 ? string(abi.encodePacked(
      baseURI, 
      tokenId.toString()
      )) : "";
  }

  function lastOwnedTokenURI() external view returns (string memory) {
    require (lastTokenMinted[msg.sender] != 0, "User hasn't minted any token");
    return tokenURI(lastTokenMinted[msg.sender]);
  }


  function mint(address receiver, IEnums.Rarity rarity, uint256 gearType, uint256 category, uint256 durability) external onlyCollectionManager {
    require(!lock, 'locked');
    lock = true;
    Gear memory _gear = Gear(rarity, gearType, category, durability, false, true);
    gears[nextIdToMint] = _gear;
    _safeMint(receiver, nextIdToMint);
    lastTokenMinted[receiver] = nextIdToMint;
    nextIdToMint++;
    lock = false;
  }

  function burn(uint256 tokenId) external onlyCollectionManager {
    gears[tokenId].locked = false;
    gears[tokenId].set = false;
    _burn(tokenId);
  }


  function allMyTokensPaginate(uint256 _from, uint256 _to) external view returns(uint256[] memory, Gear[] memory) {
    uint256 tokenCount = balanceOf(msg.sender);
    if (tokenCount <= _from || _from > _to || tokenCount == 0) {
      return (new uint256[](0), new Gear[](0));
    }
    uint256 to = (tokenCount - 1 > _to) ? _to : tokenCount - 1;
    uint256[] memory result = new uint256[](to - _from + 1);
    Gear[] memory resultGears = new Gear[](to - _from + 1);
    for (uint256 i = _from; i <= to; i++) {
      result[i - _from] = tokenOfOwnerByIndex(msg.sender, i);
      resultGears[i - _from] = gears[result[i - _from]];
    }
    return (result, resultGears);
  }

  function allTokensPaginate(uint256 _from, uint256 _to) external view returns(uint256[] memory, Gear[] memory) {
    uint256 tokenCount = ERC721Enumerable.totalSupply();
    if (tokenCount <= _from || _from > _to || tokenCount == 0) {
      return (new uint256[](0), new Gear[](0));
    }
    uint256 to = (tokenCount - 1 > _to) ? _to : tokenCount - 1;
    uint256[] memory ids = new uint256[](to - _from + 1);
    Gear[] memory gearsResult = new Gear[](to - _from + 1);
    for (uint256 i = _from; i <= to; i++) {
      ids[i - _from] = tokenByIndex(i);
      gearsResult[i - _from] = gears[tokenByIndex(i)];
    }
    return (ids, gearsResult);
  }

 
  function lockGear(uint256 tokenId) external onlyCollectionManager {
    gears[tokenId].locked = true;
  }

  function unlockGear(uint256 tokenId) external onlyCollectionManager {
    gears[tokenId].locked = false;
  }

  function decreaseDurability(uint256 tokenId, uint32 amount) external onlyCollectionManager {
    if (gears[tokenId].durability <= amount) {
      gears[tokenId].locked = false;
      gears[tokenId].set = false;
       _burn(tokenId);
    }

    gears[tokenId].durability -= amount;
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override {
    super._beforeTokenTransfer(from, to, tokenId);

    require(!gears[tokenId].locked, "This gear is locked by owner and can not be transferred");
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyOwner {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }

}
