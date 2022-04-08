// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract MartianColonists is ERC721Enumerable, Ownable {
  string private nftBaseURI;
  address public avatarManager;
  mapping (uint256 => string) public names;
  bool lock;

  modifier onlyAvatarManager {
    require(msg.sender == avatarManager, 'only avatar manager');
    _;
  }

  constructor (string memory _nftBaseURI) ERC721('Martian Colonists', 'MCL') {
    nftBaseURI = _nftBaseURI;
  }

  function setAvatarManager(address _avatarManager) external onlyOwner {
    avatarManager = _avatarManager;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return nftBaseURI;
  }

  function setBaseURI(string memory newURI) external onlyOwner {
    nftBaseURI = newURI;
  }

  function mint(address receiver) external onlyAvatarManager {
    require(!lock, 'locked');
    lock = true;
    _safeMint(receiver, ERC721Enumerable.totalSupply() + 1); // +1 because we emit 0 and start with 1
    lock = false;
  }

  function setName(uint256 tokenId, string memory _name) external onlyAvatarManager {
    names[tokenId] = _name;
  }
}
