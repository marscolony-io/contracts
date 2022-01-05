// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './interfaces/NFTMintableInterface.sol';
import './interfaces/PauseInterface.sol';
import './interfaces/ERC20MintBurnInterface.sol';


/**
 * Game logic; upgradable
 */
contract GameManager is PausableUpgradeable {
  uint256[50] private ______gm_gap_0;

  address public DAO; // owner

  address public treasury;
  
  address public liquidity;

  uint256 public price;

  address public CLNYAddress;

  uint256 public maxTokenId;

  address public MCAddress;

  uint256[50] private ______gm_gap_1;

  struct LandData {
    uint256 fixedEarnings; // already earned CLNY, but not withdrawn yet
    uint64 lastCLNYCheckout; // (now - lastCLNYCheckout) * 'earning speed' + fixedEarnings = farmed so far
    uint8 baseStation; // 0 or 1
    uint8 transport; // 0 or 1, 2, 3 (levels)
    uint8 robotAssembly; // 0 or 1, 2, 3 (levels)
    uint8 powerProduction; // 0 or 1, 2, 3 (levels)
  }

  mapping (uint256 => LandData) private tokenData;

  uint256[50] private ______gm_gap_2;

  event Airdrop (address indexed receiver, uint256 indexed tokenId);
  event BuildBaseStation (uint256 tokenId, address indexed owner);
  event BuildTransport (uint256 tokenId, address indexed owner, uint8 level);
  event BuildRobotAssembly (uint256 tokenId, address indexed owner, uint8 level);
  event BuildPowerProduction (uint256 tokenId, address indexed owner, uint8 level);

  modifier onlyDAO {
    require(msg.sender == DAO, 'Only DAO');
    _;
  }

  modifier onlyTokenOwner(uint256 tokenId) {
    require(NFTMintableInterface(MCAddress).ownerOf(tokenId) == msg.sender, "You aren't the token owner");
    _;
  }

  function initialize(
    address _DAO,
    address _CLNYAddress,
    address _MCAddress,
    address _treasury,
    address _liquidity
  ) public initializer {
    __Pausable_init();
    DAO = _DAO;
    CLNYAddress = _CLNYAddress;
    MCAddress = _MCAddress;
    maxTokenId = 21000;
    price = 250 ether;
    treasury = _treasury;
    liquidity = _liquidity;
  }

  /**
   * From SafeMath
   */
  function sub(
    uint256 a,
    uint256 b,
    string memory errorMessage
  ) internal pure returns (uint256) {
    unchecked {
      require(b <= a, errorMessage);
      return a - b;
    }
  }

  /**
   * Tranfers ownership
   */
  function transferDAO(address _DAO) external onlyDAO {
    DAO = _DAO;
  }

  /**
   * Sets treasury address
   */
  function setTreasury(address _treasury) external onlyDAO {
    treasury = _treasury;
  }

  /**
   * Sets liquidity address
   */
  function setLiquidity(address _liquidity) external onlyDAO {
    liquidity = _liquidity;
  }

  /**
   * Cost of minting for `tokenCount` tokens
   */
  function getFee(uint256 tokenCount) public view returns (uint256) {
    return price * tokenCount;
  }

  /**
   * Sets the cost of minting for 1 token
   */
  function setPrice(uint256 _price) external onlyDAO {
    require(_price >= 0.1 ether && _price <= 10000 ether, 'New price is out of bounds');
    price = _price;
  }

  /**
   * `maxTokenId` increase may be needed if we decide to merge tokens or to sell poles (they are not tokenized yet)
   */
  function setMaxTokenId(uint256 _id) external onlyDAO {
    require(_id > maxTokenId, 'New max id is not over current');
    maxTokenId = _id;
  }

  /**
   * Sets ERC20 token address
   */
  function setCLNYAddress(address _address) external onlyDAO {
    CLNYAddress = _address;
  }

  /**
   * Sets ERC721 token address
   */
  function setMCAddress(address _address) external onlyDAO {
    MCAddress = _address;
  }

  function mintNFT(address _address, uint256 tokenId) private {
    require (tokenId > 0 && tokenId <= maxTokenId, 'Token id out of bounds');
    NFTMintableInterface(MCAddress).mint(_address, tokenId);
    tokenData[tokenId].lastCLNYCheckout = uint64(block.timestamp);
  }

  /**
   * Mints a token
   */
  function claimOne(uint256 tokenId) external payable whenNotPaused {
    require (msg.value == price, 'Wrong claiming fee');
    mintNFT(msg.sender, tokenId);
  }

  /**
   * Mints several tokens
   * Pls check gas limits to get max possible count
   */
  function claim(uint256[] calldata tokenIds) external payable whenNotPaused {
    require (tokenIds.length != 0, "You can't claim 0 tokens");
    require (msg.value == getFee(tokenIds.length), 'Wrong claiming fee');
    for (uint8 i = 0; i < tokenIds.length; i++) {
      mintNFT(msg.sender, tokenIds[i]);
    }
  }

  function pause() external onlyDAO {
    _pause();
    PauseInterface(CLNYAddress).pause();
    PauseInterface(MCAddress).pause();
  }

  function unpause() external onlyDAO {
    _unpause();
    PauseInterface(CLNYAddress).unpause();
    PauseInterface(MCAddress).unpause();
  }

  function airdrop(address receiver, uint256 tokenId) external whenNotPaused onlyDAO {
    mintNFT(receiver, tokenId);
    emit Airdrop(receiver, tokenId);
  }

  uint8 constant BASE_STATION = 0;
  /** these constants (for sure just `_deduct` function) can be changed while upgrading */
  uint256 constant BASE_STATION_COST = 30;
  uint256 constant LEVEL_1_COST = 120;
  uint256 constant LEVEL_2_COST = 270;
  uint256 constant LEVEL_3_COST = 480;

  /**
   * Burn CLNY token for building enhancements
   * Assume decimals() is always 18
   */
  function _deduct(uint8 level) private {
    uint256 amount = 0;
    if (level == BASE_STATION) {
      amount = BASE_STATION_COST * 10 ** 18;
    }
    if (level == 1) {
      amount = LEVEL_1_COST * 10 ** 18;
    }
    if (level == 2) {
      amount = LEVEL_2_COST * 10 ** 18;
    }
    if (level == 3) {
      amount = LEVEL_3_COST * 10 ** 18;
    }
    require (amount > 0, 'Wrong level');
    ERC20MintBurnInterface(CLNYAddress).burn(msg.sender, amount);
  }

  function getLastCheckout(uint256 tokenId) public view returns (uint256) {
    return tokenData[tokenId].lastCLNYCheckout;
  }

  function getEarned(uint256 tokenId) public view returns (uint256) {
    return getEarningSpeed(tokenId)
      * sub(block.timestamp, getLastCheckout(tokenId), 'Math error') * 10 ** 18 / (24 * 60 * 60)
      + tokenData[tokenId].fixedEarnings;
  }

  function getEarningSpeed(uint256 tokenId) public view returns (uint256) {
    uint256 speed = 1; // bare land
    if (tokenData[tokenId].baseStation > 0) {
      speed = speed + 1; // base station gives +1
    }
    if (tokenData[tokenId].transport > 0 && tokenData[tokenId].transport <= 3) {
      speed = speed + tokenData[tokenId].transport + 1; // others give from +2 to +4
    }
    if (tokenData[tokenId].robotAssembly > 0 && tokenData[tokenId].robotAssembly <= 3) {
      speed = speed + tokenData[tokenId].robotAssembly + 1;
    }
    if (tokenData[tokenId].powerProduction > 0 && tokenData[tokenId].powerProduction <= 3) {
      speed = speed + tokenData[tokenId].powerProduction + 1;
    }
    return speed;
  }

  function fixEarnings(uint256 tokenId) private {
    tokenData[tokenId].fixedEarnings = getEarned(tokenId);
    tokenData[tokenId].lastCLNYCheckout = uint64(block.timestamp);
  }

  /**
   * Builds base station
   */
  function buildBaseStation(uint256 tokenId) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].baseStation == 0, 'There is already a base station');
    _deduct(BASE_STATION);
    fixEarnings(tokenId);
    tokenData[tokenId].baseStation = 1;
    emit BuildBaseStation(tokenId, msg.sender);
  }

  /**
   * Builds transport
   * `uint8 level` is very important - it prevents accidental spending ERC20 with double transactions
   */
  function buildTransport(uint256 tokenId, uint8 level) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].transport == sub(level, 1, 'Math error'), 'Can buy only next level');
    _deduct(level);
    fixEarnings(tokenId);
    tokenData[tokenId].transport = level;
    emit BuildTransport(tokenId, msg.sender, level);
  }

  /**
   * Builds robot assembly
   * `uint8 level` is very important - it prevents accidental spending ERC20 with double transactions
   */
  function buildRobotAssembly(uint256 tokenId, uint8 level) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].robotAssembly == sub(level, 1, 'Math error'), 'Can buy only next level');
    _deduct(level);
    fixEarnings(tokenId);
    tokenData[tokenId].robotAssembly = level;
    emit BuildRobotAssembly(tokenId, msg.sender, level);
  }

  /**
   * Builds power production
   * `uint8 level` is very important - it prevents accidental spending ERC20 with double transactions
   */
  function buildPowerProduction(uint256 tokenId, uint8 level) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].powerProduction == sub(level, 1, 'Math error'), 'Can buy only next level');
    _deduct(level);
    fixEarnings(tokenId);
    tokenData[tokenId].powerProduction = level;
    emit BuildPowerProduction(tokenId, msg.sender, level);
  }

  /**
   * Enhancements getter
   */
  function getEnhancements(uint256 tokenId) external view returns (uint8, uint8, uint8, uint8) {
    return (
      tokenData[tokenId].baseStation,
      tokenData[tokenId].transport,
      tokenData[tokenId].robotAssembly,
      tokenData[tokenId].powerProduction
    );
  }

  /**
   * Claims CLNY from several tokens
   * Pls check gas limits to get max possible count (> 100 for Harmony chain)
   */
  function claimEarned(uint256[] calldata tokenIds) external whenNotPaused {
    require (tokenIds.length != 0, 'Empty array');
    for (uint8 i = 0; i < tokenIds.length; i++) {
      require (msg.sender == NFTMintableInterface(MCAddress).ownerOf(tokenIds[i]));
      uint256 earned = getEarned(tokenIds[i]);
      ERC20MintBurnInterface(CLNYAddress).mint(msg.sender, earned);
      ERC20MintBurnInterface(CLNYAddress).mint(treasury, earned * 31 / 49);
      ERC20MintBurnInterface(CLNYAddress).mint(liquidity, earned * 31 / 49);
      tokenData[tokenIds[i]].fixedEarnings = 0;
      tokenData[tokenIds[i]].lastCLNYCheckout = uint64(block.timestamp);
    }
  }

  function withdraw() external onlyDAO {
    require (address(this).balance != 0, 'Nothing to withdraw');
    (bool success, ) = payable(DAO).call{ value: address(this).balance }('');
    require(success, 'Withdraw failed');
  }

  function withdrawValue(uint256 value) external onlyDAO {
    require (address(this).balance != 0, 'Nothing to withdraw');
    (bool success, ) = payable(DAO).call{ value: value }('');
    require(success, 'Withdraw failed');
  }
}
