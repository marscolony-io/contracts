// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ERC721.sol";
import "./Storage.sol";


contract MarsColony is ERC721, Storage {
  mapping (address => uint256[]) private _tokens;
  mapping (uint256 => uint256) private _tokenPositionsPlusOne;
  uint256[] private _allMintedTokens;

  // gnosis: (carefully set for current network!)
  address public DAO;
  // contract/wallet, which is able to set gameValue
  address public GameDispatcher = 0x0000000000000000000000000000000000000000;

  event ChangeDispatcher(address indexed dispatcher);

  uint constant PRICE = 0.677 ether;

  function tokensOf(address owner) public view virtual returns (uint256[] memory) {
    require(owner != address(0), "ERC721: tokens query for the zero address");
    return _tokens[owner];
  }

  function allMintedTokens() public view virtual returns (uint256[] memory) {
    return _allMintedTokens;
  }

  constructor (address _DAO) ERC721("MarsColony", "MC") {
    DAO = _DAO;
  }

  function storeUserValue(uint256 tokenId, string memory data) public {
    require(ERC721.ownerOf(tokenId) == msg.sender);
    Storage._storeUserValue(tokenId, data);
  }

  function storeGameValue(uint256 tokenId, string memory data) public {
    require(GameDispatcher == msg.sender, 'Only dispather can store game values');
    Storage._storeGameValue(tokenId, data);
  }

  function toggleGameState(uint256 tokenId, uint16 toggle) public {
    require(GameDispatcher == msg.sender, 'Only dispather can toggle game state');
    Storage._toggleGameState(tokenId, toggle);
  }

  function setGameDispatcher(address _GameDispatcher) public {
    GameDispatcher = _GameDispatcher;
    emit ChangeDispatcher(_GameDispatcher);
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return 'https://meta.marscolony.io/';
  }

  function claim(uint256 _tokenId) public payable {
    require(msg.value == MarsColony.PRICE, 'Wrong token cost');
    require(_tokenId != 0, 'Token id must be over zero');
    require(_tokenId <= 21000, 'Maximum token id is 21000');
    _safeMint(msg.sender, _tokenId);
  }

  // anyone can call, but the withdraw is only to DAO
  function withdraw() public {
    (bool success, ) = payable(DAO).call{ value: address(this).balance }('');
    require(success, 'Transfer failed.');
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
