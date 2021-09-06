// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "./ERC721.sol";


contract MarsColony is ERC721 {
  mapping (address => uint256[]) private _tokens;
  mapping (uint256 => uint256) private _tokenPositionsPlusOne;
  uint256[] private _allMintedTokens;

  address payable constant DAO = payable(0x97438E7A978A91dC281B834B62bb5737f629Aca9);
  uint constant PRICE = 0.001 ether;

  function tokensOf(address owner) public view virtual returns (uint256[] memory) {
    require(owner != address(0), "ERC721: tokens query for the zero address");
    return _tokens[owner];
  }

  function allMintedTokens() public view virtual returns (uint256[] memory) {
    return _allMintedTokens;
  }

  constructor () ERC721("MarsColony", "MC") {

  }

  function buy(uint256 _tokenId) public payable {
    require(msg.value == MarsColony.PRICE, 'Token cost is 0.01 ether');
    _safeMint(msg.sender, _tokenId);
  }

  // function buy5x5(uint256 _centerTokenId) public payable {
  //   require(msg.value == 25 * MarsColony.PRICE, '25 tokens cost is 0.25 ether');
  //   for (uint8 dr = 2-2; dr <= 2+2; dr++) {
  //     for (uint8 dphi = 2-2; dphi <= 2+2; dphi++) {
  //       _safeMint(msg.sender, _centerTokenId + dr * 1000 + dphi - 2002);
  //     }
  //   }
  // }

  // anyone can call, but withdraw only to DAO
  function withdraw() public {
    (bool success, ) = DAO.call{ value: address(this).balance }("");
    require(success, "Transfer failed.");
  }

  function _transfer(address from, address to, uint256 tokenId) internal virtual override {
    super._transfer(from, to, tokenId);
    delete _tokens[from][_tokenPositionsPlusOne[tokenId] - 1];
    _tokens[to].push(tokenId);
    _tokenPositionsPlusOne[tokenId] = _tokens[to].length;
  }

  function _mint(address to, uint256 tokenId) internal virtual override {
    super._mint(to, tokenId);
    _allMintedTokens.push(tokenId);
    _tokens[msg.sender].push(tokenId);
    _tokenPositionsPlusOne[tokenId] = _tokens[msg.sender].length;
    // ^^^ here we store position of token in an array _tokens[msg.sender] to delete it later with less gas
  }
}
