// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/ILootboxes.sol';


contract Lootboxes is ERC721Enumerable, ILootboxes, Ownable {
  string private nftBaseURI;
  address public gameManager;
  mapping (uint256 => bool) public opened;
  bool lock;

  modifier onlyGameManager {
    require(msg.sender == gameManager, 'only game manager');
    _;
  }

  constructor (string memory _nftBaseURI) ERC721('Lootboxes', 'LBX') {
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

  function mint(address receiver) external override onlyGameManager {
    require(!lock, 'locked');
    lock = true;
    _safeMint(receiver, ERC721Enumerable.totalSupply() + 1); // +1 because we emit 0 and start with 1
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
