/**
 * ERC721 MC token - land plots
 * For INO in Liquidifty
 */

// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract McIno is ERC721Enumerable, Ownable {
  bool lock;

  constructor() ERC721('INO for MarsColony', 'inoMC') { }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

    return "https://marscolony.io/ino.json";
  }

  function mint(address receiver, uint256 count) external onlyOwner {
    require(!lock, 'locked');
    lock = true;
    uint256 supply = ERC721Enumerable.totalSupply();
    for (uint256 i = 0; i < count; i++) {
      _safeMint(receiver, supply + 1 + i);
    }
    lock = false;
  }
}
