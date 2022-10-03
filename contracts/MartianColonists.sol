// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IDependencies.sol';


contract MartianColonists is ERC721Enumerable {
  string private nftBaseURI;
  IDependencies public d;
  mapping (uint256 => string) public names;
  bool lock;

  modifier onlyOwner {
    require(msg.sender == d.owner(), 'Only owner');
    _;
  }

  modifier onlyCollectionManager {
    require(msg.sender == address(d.collectionManager()), 'only collection manager');
    _;
  }

  constructor (string memory _nftBaseURI, IDependencies _d) ERC721('Martian Colonists', 'MCL') {
    d = _d;
    nftBaseURI = _nftBaseURI;
  }

  function setDependencies(IDependencies addr) external onlyOwner {
    d = addr;
  }

  function owner() public view returns (address) {
    return d.owner();
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return nftBaseURI;
  }

  function setBaseURI(string memory newURI) external onlyOwner {
    nftBaseURI = newURI;
  }

  function mint(address receiver) external onlyCollectionManager {
    require(!lock, 'locked');
    lock = true;
    _safeMint(receiver, ERC721Enumerable.totalSupply() + 1); // +1 because we emit 0 and start with 1
    lock = false;
  }

  function setName(uint256 tokenId, string memory _name) external onlyCollectionManager {
    names[tokenId] = _name;
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyOwner {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }
}
