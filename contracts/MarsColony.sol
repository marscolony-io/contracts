/**
 * Seeing this? Hi! :)
 * https://github.com/marscolony-io/contracts
 * Pls star the repo :)
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import './ERC721Enumerable2.sol';
import "./MarsStorage.sol";


contract MarsColony is ERC721Enumerable, MarsStorage {
  modifier canMint(uint256 tokenId) {
    require(tokenId != 0, 'Token id must be over zero');
    require(tokenId <= 21000, 'Maximum token id is 21000');
    _;
  }

  constructor (address _DAO, int8 _maxAirdrops, address[3] memory _airdroppers) ERC721('MarsColony', 'MC') MarsStorage(_DAO) {
    airdropsLeft = _maxAirdrops;
    airdroppers = _airdroppers;
  }

  // AIRDROP SECTION
  // next addresses are the only who can airdrop
  event Airdrop (address indexed initiator, address indexed receiver, uint256 indexed tokenId);

  address[3] public airdroppers;
  int8 public airdropsLeft;

  modifier canAirdrop {
    require(
      msg.sender == airdroppers[0] ||
      msg.sender == airdroppers[1] ||
      msg.sender == airdroppers[2],
      "You can't airdrop"
    );
    require(airdropsLeft > 0, 'No more airdrops left');
    _; // airdropsLeft will be decreased here on successful airdrop
  }

  function airdrop (address receiver, uint256 tokenId) external canMint(tokenId) canAirdrop {
    airdropsLeft = airdropsLeft - 1;
    _safeMint(receiver, tokenId);
    emit Airdrop(msg.sender, receiver, tokenId);
  }
  // END AIRDROP SECTION

  uint constant PRICE = 0.677 ether;

  function _baseURI() internal view virtual override returns (string memory) {
    return 'https://meta.marscolony.io/';
  }

  function _claim(uint256 tokenId) internal canMint(tokenId) {
    _safeMint(msg.sender, tokenId);
  }

  function claimOne(uint256 tokenId) external payable {
    require (msg.value == MarsColony.PRICE, 'Wrong claiming fee');
    _claim(tokenId);
  }

  function getFee(uint256 tokenCount) public pure returns (uint256) {
    return MarsColony.PRICE * tokenCount;
  }

  function claim(uint256[] calldata tokenIds) external payable {
    // can run out of gas before 100 tokens, but such revert is ok
    require (tokenIds.length <= 100, "You can't claim more than 100 tokens");
    require (tokenIds.length != 0, "You can't claim 0 tokens");
    require (msg.value == getFee(tokenIds.length), 'Wrong claiming fee');
    for (uint8 i = 0; i < tokenIds.length; i++) {
      _claim(tokenIds[i]);
    }
  }

  function storeUserValue(uint256 tokenId, string memory data) external {
    require(ownerOf(tokenId) == msg.sender, "You aren't the token owner");
    _userStore[tokenId] = data;
    emit UserData(msg.sender, tokenId, data);
  }

  function allMintedTokens() view external returns (uint256[] memory) {
    uint supply = totalSupply();
    uint256[] memory tokens = new uint256[](supply);
    for (uint8 i = 0; i < supply; i++) {
      tokens[i] = tokenByIndex(i);
    }
    return tokens;
  }
}
