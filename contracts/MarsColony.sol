/**
 * Seeing this? Hi! :)
 * https://github.com/marscolony-io/contracts
 * Pls star the repo :)
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import './ERC721Enumerable2.sol';
import './MarsStorage.sol';
import '@openzeppelin/contracts/security/Pausable.sol';


contract MarsColony is ERC721Enumerable, MarsStorage, Pausable {
  uint constant PRICE = 0.677 ether;
  uint constant PRESALE_PRICE = PRICE / 2;
  bool public isPresale = true;

  function getPrice() public view returns (uint256) {
    return isPresale ? PRESALE_PRICE : PRICE;
  }

  function endPresale() external onlyDAO {
    require(isPresale, 'Presale already finished');
    isPresale = false;
  }

  string private nftBaseURI = 'https://meta.marscolony.io/';

  // hodl
  mapping(uint256 => uint256) public lastTransferTimestamp;
  mapping(address => uint256) private pastCumulativeHODL;

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override {
    super._beforeTokenTransfer(from, to, tokenId);

    uint256 timeHodld = block.timestamp - lastTransferTimestamp[tokenId];
    if (from != address(0)) {
      pastCumulativeHODL[from] += timeHodld;
    }
    lastTransferTimestamp[tokenId] = block.timestamp;
  }

  function cumulativeHODL(address user) public view returns (uint256) {
    uint256 _cumulativeHODL = pastCumulativeHODL[user];
    uint256 bal = balanceOf(user);
    for (uint256 i = 0; i < bal; i++) {
      uint256 tokenId = tokenOfOwnerByIndex(user, i);
      uint256 timeHodld = block.timestamp - lastTransferTimestamp[tokenId];
      _cumulativeHODL += timeHodld;
    }
    return _cumulativeHODL;
  }
  // end hodl

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

  function airdrop(address receiver, uint256 tokenId) external canMint(tokenId) whenNotPaused canAirdrop {
    airdropsLeft = airdropsLeft - 1;
    _safeMint(receiver, tokenId);
    emit Airdrop(msg.sender, receiver, tokenId);
  }
  // END AIRDROP SECTION

  function _baseURI() internal view virtual override returns (string memory) {
    return nftBaseURI;
  }

  function setBaseURI(string memory newURI) external onlyDAO {
    nftBaseURI = newURI;
  }

  function _claim(uint256 tokenId) internal canMint(tokenId) {
    _safeMint(msg.sender, tokenId);
  }

  function claimOne(uint256 tokenId) external payable whenNotPaused {
    require (msg.value == getPrice(), 'Wrong claiming fee');
    _claim(tokenId);
  }

  function getFee(uint256 tokenCount) public view returns (uint256) {
    return getPrice() * tokenCount;
  }

  function claim(uint256[] calldata tokenIds) external payable whenNotPaused {
    // can run out of gas before 100 tokens, but such revert is ok
    require (tokenIds.length <= 100, "You can't claim more than 100 tokens");
    require (tokenIds.length != 0, "You can't claim 0 tokens");
    require (msg.value == getFee(tokenIds.length), 'Wrong claiming fee');
    for (uint8 i = 0; i < tokenIds.length; i++) {
      _claim(tokenIds[i]);
    }
  }

  function storeUserValue(uint256 tokenId, string memory data) external whenNotPaused {
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

  // pause/unpause only to stop/start claiming/airdrops
  function pause() external onlyDAO {
    _pause();
  }

  function unpause() external onlyDAO {
    _unpause();
  }
}
