// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './interfaces/MintBurnInterface.sol';
import './interfaces/PauseInterface.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IPoll.sol';
import './Shares.sol';


/**
 * Game logic; upgradable
 */
contract GameManager is PausableUpgradeable, Shares {
  // 25 256bit slots in Shares.sol
  uint256[25] private ______gm_gap_0;

  address public DAO; // owner

  address public treasury;
  address public liquidity;
  uint256 public price;
  address public CLNYAddress;
  uint256 public maxTokenId;
  address public MCAddress;
  address public avatarAddress;
  address public pollAddress;
  address public missionManagerReservedSlot;
  address public martianColonistsReservedSlot;
  address public backendSignerReservedSlot;
  mapping (bytes32 => bool) private usedSignaturesReservedSlot;

  bool allowlistOnly;
  mapping (address => bool) private allowlist;
  uint256 public allowlistLimit;

  uint256[42] private ______gm_gap_1;

  struct LandData {
    // TODO before deploy - check all zeros
    uint8 baseStation; // 0 or 1
    uint8 transport; // 0 or 1, 2, 3 (levels)
    uint8 robotAssembly; // 0 or 1, 2, 3 (levels)
    uint8 powerProduction; // 0 or 1, 2, 3 (levels)
  }

  struct PlaceOnLand {
    uint32 x;
    uint32 y;
    uint32 rotate; // for future versions
  }

  /**
   * Data to output
   */
  struct AttributeData {
    uint256 speed; // CLNY earning speed
    uint256 earned;
    uint8 baseStation; // 0 or 1
    uint8 transport; // 0 or 1, 2, 3 (levels)
    uint8 robotAssembly; // 0 or 1, 2, 3 (levels)
    uint8 powerProduction; // 0 or 1, 2, 3 (levels)
  }

  mapping (uint256 => LandData) private tokenData;

  mapping (uint256 => PlaceOnLand) public baseStationsPlacement;
  mapping (uint256 => PlaceOnLand) public transportPlacement;
  mapping (uint256 => PlaceOnLand) public robotAssemblyPlacement;
  mapping (uint256 => PlaceOnLand) public powerProductionPlacement;

  bool internal locked;

  uint256[45] private ______gm_gap_2;

  event Airdrop (address indexed receiver, uint256 indexed tokenId);
  // f9917faa5009c58ed8bd6a1c70b79e1fbefc8afe3e7142ba8b854ccb887fb262
  event BuildBaseStation (uint256 tokenId, address indexed owner);
  // bce74c3d6a81a6ea4b55a703751c4fbad439c2ce8997bc12bb2463cb3f6d987b
  event BuildTransport (uint256 tokenId, address indexed owner, uint8 level);
  // 6f4c6fa65abfbdb878065cf56239c87467b1308866c1f27dad012e666a589b68
  event BuildRobotAssembly (uint256 tokenId, address indexed owner, uint8 level);
  // 9914b04dac571a45d7a7b33184088cbd4d62a2ed88e64602a6b8a6a93b3fb0a6
  event BuildPowerProduction (uint256 tokenId, address indexed owner, uint8 level);
  event SetPrice (uint256 price);

  modifier onlyDAO {
    require(msg.sender == DAO, 'Only DAO');
    _;
  }

  modifier onlyTokenOwner(uint256 tokenId) {
    require(MintBurnInterface(MCAddress).ownerOf(tokenId) == msg.sender, "You aren't the token owner");
    _;
  }

  modifier nonReentrant {
    require (!locked, 'reentrancy guard');
    locked = true;
    _;
    locked = false;
  }

  function setClnyPerSecond(uint256 newSpeed) external onlyDAO {
    updatePool(CLNYAddress);
    clnyPerSecond = newSpeed;
  }

  function addToAllowlist(address[] calldata _addresses) external {
    // allowlist from one specific address
    require(msg.sender == 0xf4Fb3ac483C339fC48AD095409C958cF93f2A548, 'invalid sender');
    for (uint i = 0; i < _addresses.length; i++) {
      allowlist[_addresses[i]] = true;
    }
  }

  function setAllowListLimit(uint256 limit, bool listOn) external {
    // allowlist from one specific address
    require(msg.sender == 0xf4Fb3ac483C339fC48AD095409C958cF93f2A548, 'invalid sender');
    allowlistLimit = limit;
    allowlistOnly = listOn;
  }

  function setMCAddress(address _address) external onlyDAO {
    MCAddress = _address;
  }

  function saleData() external view returns (bool allowed, uint256 minted, uint256 limit) {
    allowed = !allowlistOnly || allowlist[msg.sender];
    minted = MintBurnInterface(MCAddress).totalSupply();
    limit = allowlistLimit;
  }

  function setAvatarAddress(address _avatarAddress) external onlyDAO {
    avatarAddress = _avatarAddress;
  }

  function setPollAddress(address _address) external onlyDAO {
    pollAddress = _address;
  }

  function getPollData() external view returns (string memory, string memory, string[] memory, uint256[] memory, bool) {
    if (pollAddress == address(0)) {
      return ('', '', new string[](0), new uint256[](0), false);
    }
    (string memory description, string memory caption, string[] memory items) = IPoll(pollAddress).getVoteTopic();
    uint256[] memory results = new uint256[](items.length);
    for (uint8 i = 0; i < items.length; i++) {
      results[i] = IPoll(pollAddress).totalVotesFor(i);
    }
    return (description, caption, items, results, IPoll(pollAddress).canVote(msg.sender));
  }

  function vote(uint8 decision) external {
    IPoll(pollAddress).vote(msg.sender, decision);
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
   * Transfers ownership
   * 0x7a318866
   */
  function transferDAO(address _DAO) external onlyDAO {
    DAO = _DAO;
  }

  /**
   * Cost of minting for `tokenCount` tokens
   * 0xfcee45f4
   */
  function getFee(uint256 tokenCount) public view returns (uint256) {
    return price * tokenCount;
  }

  /**
   * Sets the cost of minting for 1 token
   */
  function setPrice(uint256 _price) external onlyDAO {
    require(_price >= 0.01 ether && _price <= 10000 ether, 'New price is out of bounds');
    price = _price;
    emit SetPrice(_price);
  }

  function mintAvatar() external nonReentrant {
    _deduct(MINT_AVATAR_LEVEL, REASON_MINT_AVATAR);
    MintBurnInterface(avatarAddress).mint(msg.sender);
  }

  uint64 constant startCLNYDate = 1654041600; // 1 Jun 2022

  function mintLand(address _address, uint256 tokenId) private {
    require (tokenId > 0 && tokenId <= maxTokenId, 'Token id out of bounds');
    if (allowlistOnly) {
      require(allowlist[msg.sender], 'you are not in allowlist');
      require(MintBurnInterface(MCAddress).totalSupply() < allowlistLimit, 'Presale limit has ended');
    }
    setInitialShare(tokenId);
    MintBurnInterface(MCAddress).mint(_address, tokenId);
  }

  /**
   * Mints several tokens
   */
  function claim(uint256[] calldata tokenIds) external payable nonReentrant whenNotPaused {
    require (tokenIds.length != 0, "You can't claim 0 tokens");
    require (msg.value == getFee(tokenIds.length), 'Wrong claiming fee');
    updatePool(CLNYAddress);
    for (uint8 i = 0; i < tokenIds.length; i++) {
      mintLand(msg.sender, tokenIds[i]);
    }
    // 0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4 - creatorsDAO
    (bool success, ) = payable(0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4).call{ value: msg.value }('');
    require(success, 'Transfer failed');
  }

  /**
   * 0x8456cb59
   */
  function pause() external onlyDAO {
    _pause();
    PauseInterface(CLNYAddress).pause();
    PauseInterface(MCAddress).pause();
    if (avatarAddress != address(0)) {
      PauseInterface(avatarAddress).pause();
    }
  }

  /**
   * 0x3f4ba83a
   */
  function unpause() external onlyDAO {
    _unpause();
    PauseInterface(CLNYAddress).unpause();
    PauseInterface(MCAddress).unpause();
    if (avatarAddress != address(0)) {
      PauseInterface(avatarAddress).unpause();
    }
  }

  function airdrop(address receiver, uint256 tokenId) external whenNotPaused onlyDAO {
    mintLand(receiver, tokenId);
    emit Airdrop(receiver, tokenId);
  }

  uint8 constant BASE_STATION = 0;
  /** these constants (for sure just `_deduct` function) can be changed while upgrading */
  uint256 constant BASE_STATION_COST = 30;
  uint256 constant AVATAR_MINT_COST = 30;
  uint256 constant LEVEL_1_COST = 120;
  uint256 constant LEVEL_2_COST = 270;
  uint256 constant LEVEL_3_COST = 480;
  uint8 constant MINT_AVATAR_LEVEL = 254;
  uint8 constant PLACEMENT_LEVEL = 255;
  uint256 constant PLACEMENT_COST = 5;
  uint256 constant REASON_UPGRADE = 1;
  uint256 constant REASON_PLACE = 2;
  uint256 constant REASON_RENAME_AVATAR = 3;
  uint256 constant REASON_MINT_AVATAR = 4;
  uint256 constant REASON_ROYALTY = 5;
  uint256 constant REASON_EARNING = 6;
  uint256 constant REASON_TREASURY = 7;
  uint256 constant REASON_LP_POOL = 8;
  uint256 constant CLNY_REASON_BASIC = 9;

  /**
   * Burn CLNY token for building enhancements
   * Assume decimals() is always 18
   */
  function _deduct(uint8 level, uint256 reason) private {
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
    if (level == PLACEMENT_LEVEL) {
      amount = PLACEMENT_COST * 10 ** 18;
    }
    if (level == MINT_AVATAR_LEVEL) {
      amount = AVATAR_MINT_COST * 10 ** 18;
      // artist and team minting royalties
      MintBurnInterface(CLNYAddress).mint(
        0x2581A6C674D84dAD92A81E8d3072C9561c21B935,
        AVATAR_MINT_COST * 10 ** 18 * 3 / 100,
        REASON_ROYALTY
      );
    }
    require (amount > 0, 'Wrong level');
    MintBurnInterface(CLNYAddress).burn(msg.sender, amount, reason);
  }

  /**
   * deprecated, use getAttributesMany
   * 0x08cfe44b
   */
  function getEarningData(uint256[] memory tokenIds) external view returns (uint256, uint256) {
    uint256 result = 0;
    uint256 speed = 0;
    for (uint256 i = 0; i < tokenIds.length; i++) {
      result = result + getEarned(tokenIds[i]);
      speed = speed + getEarningSpeed(tokenIds[i]);
    }
    return (result, speed);
  }

  /* 0xfd5da729 */
  function getEarningSpeed(uint256 tokenId) public pure returns (uint256) {
    return 0; // no constant speed for polygon
  }

  /**
   * Builds base station
   * deprecated: new base stations should be placed with buildAndPlaceBaseStation
   * 0xcfc26d99
   */
  function buildBaseStation(uint256 tokenId) public onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].baseStation == 0, 'There is already a base station');
    addToShare(tokenId, 1, CLNYAddress);
    tokenData[tokenId].baseStation = 1;
    _deduct(BASE_STATION, REASON_UPGRADE);
    emit BuildBaseStation(tokenId, msg.sender);
  }

  /**
   * Builds and places base station
   * 0x23c32819
   */
  function buildAndPlaceBaseStation(uint256 tokenId, uint32 x, uint32 y) external {
    baseStationsPlacement[tokenId].x = x;
    baseStationsPlacement[tokenId].y = y;
    buildBaseStation(tokenId);
  }

  /**
   * Places base station
   * deprecated: new base stations should be placed with buildAndPlaceBaseStation
   * 0x5f549163
   */
  function placeBaseStation(uint256 tokenId, uint32 x, uint32 y, bool free) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].baseStation != 0, 'There should be a base station');
    if (baseStationsPlacement[tokenId].x != 0 || baseStationsPlacement[tokenId].y != 0) {
      require(!free, 'You can place only for CLNY now');
      baseStationsPlacement[tokenId].x = x;
      baseStationsPlacement[tokenId].y = y;
      // already placed -> new placement is for 5 clny
      // if users places back to 0, 0 it's ok not to deduct him 5 clny
      _deduct(PLACEMENT_LEVEL, REASON_PLACE);
    } else {
      baseStationsPlacement[tokenId].x = x;
      baseStationsPlacement[tokenId].y = y;
    }
  }

  /**
   * Builds transport
   * `uint8 level` is very important - it prevents accidental spending ERC20 with double transactions
   * 0x33e3480f
   */
  function buildTransport(uint256 tokenId, uint8 level) public onlyTokenOwner(tokenId) whenNotPaused {
    require(level <= 3, 'wrong level');
    require(tokenData[tokenId].transport == level - 1, 'Can buy only next level');
    addToShare(tokenId, level == 3 ? 2 : 1, CLNYAddress); // level 3 gives +2 shares
    tokenData[tokenId].transport = level;
    _deduct(level, REASON_UPGRADE);
    emit BuildTransport(tokenId, msg.sender, level);
  }

  /**
   * Builds and places transport
   * 0x2fc6ced1
   */
  function buildAndPlaceTransport(uint256 tokenId, uint32 x, uint32 y) external {
    transportPlacement[tokenId].x = x;
    transportPlacement[tokenId].y = y;
    buildTransport(tokenId, 1);
  }

  /**
   * Places transport
   * deprecated: for migration only
   * 0x9b416e1c
   */
  function placeTransport(uint256 tokenId, uint32 x, uint32 y, bool free) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].transport != 0, 'There should be a transport');
    if (transportPlacement[tokenId].x != 0 || transportPlacement[tokenId].y != 0) {
      require(!free, 'You can place only for CLNY now');
      transportPlacement[tokenId].x = x;
      transportPlacement[tokenId].y = y;
      // already placed -> new placement is for 5 clny
      // if users places back to 0, 0 it's ok not to deduct him 5 clny
      _deduct(PLACEMENT_LEVEL, REASON_PLACE);
    } else {
      transportPlacement[tokenId].x = x;
      transportPlacement[tokenId].y = y;
    }
  }

  /**
   * Builds robot assembly
   * `uint8 level` is very important - it prevents accidental spending ERC20 with double transactions
   * 0x9a3274c4
   */
  function buildRobotAssembly(uint256 tokenId, uint8 level) public onlyTokenOwner(tokenId) whenNotPaused {
    require(level <= 3, 'wrong level');
    require(tokenData[tokenId].robotAssembly == level - 1, 'Can buy only next level');
    addToShare(tokenId, level == 3 ? 2 : 1, CLNYAddress); // level 3 gives +2 shares
    tokenData[tokenId].robotAssembly = level;
    _deduct(level, REASON_UPGRADE);
    emit BuildRobotAssembly(tokenId, msg.sender, level);
  }

  /**
   * Builds and places robot assembly
   * 0xbd09376f
   */
  function buildAndPlaceRobotAssembly(uint256 tokenId, uint32 x, uint32 y) external {
    robotAssemblyPlacement[tokenId].x = x;
    robotAssemblyPlacement[tokenId].y = y;
    buildRobotAssembly(tokenId, 1);
  }

  /**
   * Places Robot Assembly
   * deprecated: for migration only
   * 0x15263117
   */
  function placeRobotAssembly(uint256 tokenId, uint32 x, uint32 y, bool free) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].robotAssembly != 0, 'There should be a robot assembly');
    if (robotAssemblyPlacement[tokenId].x != 0 || robotAssemblyPlacement[tokenId].y != 0) {
      require(!free, 'You can place only for CLNY now');
      robotAssemblyPlacement[tokenId].x = x;
      robotAssemblyPlacement[tokenId].y = y;
      // already placed -> new placement is for 5 clny
      // if users places back to 0, 0 it's ok not to deduct him 5 clny
      _deduct(PLACEMENT_LEVEL, REASON_PLACE);
    } else {
      robotAssemblyPlacement[tokenId].x = x;
      robotAssemblyPlacement[tokenId].y = y;
    }
  }

  /**
   * Builds power production
   * `uint8 level` is very important - it prevents accidental spending ERC20 with double transactions
   * 0xcb6ff6f9
   */
  function buildPowerProduction(uint256 tokenId, uint8 level) public onlyTokenOwner(tokenId) whenNotPaused {
    require(level <= 3, 'wrong level');
    require(tokenData[tokenId].powerProduction == level - 1, 'Can buy only next level');
    addToShare(tokenId, level == 3 ? 2 : 1, CLNYAddress); // level 3 gives +2 shares
    tokenData[tokenId].powerProduction = level;
    _deduct(level, REASON_UPGRADE);
    emit BuildPowerProduction(tokenId, msg.sender, level);
  }

  /**
   * Builds and places power production
   * 0x88cb482a
   */
  function buildAndPlacePowerProduction(uint256 tokenId, uint32 x, uint32 y) external {
    powerProductionPlacement[tokenId].x = x;
    powerProductionPlacement[tokenId].y = y;
    buildPowerProduction(tokenId, 1);
  }

  /**
   * Places Power Production
   * deprecated: for migration only
   * 0x9452cff2
   */
  function placePowerProduction(uint256 tokenId, uint32 x, uint32 y, bool free) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].powerProduction != 0, 'There should be a power production');
    if (powerProductionPlacement[tokenId].x != 0 || powerProductionPlacement[tokenId].y != 0) {
      require(!free, 'You can place only for CLNY now');
      powerProductionPlacement[tokenId].x = x;
      powerProductionPlacement[tokenId].y = y;
      // already placed -> new placement is for 5 clny
      // if users places back to 0, 0 it's ok not to deduct him 5 clny
      _deduct(PLACEMENT_LEVEL, REASON_PLACE);
    } else {
      powerProductionPlacement[tokenId].x = x;
      powerProductionPlacement[tokenId].y = y;
    }
  }

  /**
   * deprecated, use getAttributesMany
   * 0x5bde71ac
   */
  function getEnhancements(uint256 tokenId) external view returns (uint8, uint8, uint8, uint8) {
    return (
      tokenData[tokenId].baseStation,
      tokenData[tokenId].transport,
      tokenData[tokenId].robotAssembly,
      tokenData[tokenId].powerProduction
    );
  }

  /* 0x3eb87111 */
  function getAttributesMany(uint256[] calldata tokenIds) external view returns (AttributeData[] memory) {
    AttributeData[] memory result = new AttributeData[](tokenIds.length);
    for (uint256 i = 0; i < tokenIds.length; i++) {
      uint256 tokenId = tokenIds[i];
      result[i] = AttributeData(
        getEarningSpeed(tokenId),
        getEarned(tokenId),
        tokenData[tokenId].baseStation,
        tokenData[tokenId].transport,
        tokenData[tokenId].robotAssembly,
        tokenData[tokenId].powerProduction
      );
    }
    return result;
  }

  /**
   * Claims CLNY from several tokens
   * Pls check gas limits to get max possible count (> 100 for Harmony chain)
   * 0x42aa65f4
   */
  function claimEarned(uint256[] calldata tokenIds) external whenNotPaused nonReentrant {
    require (block.timestamp > startCLNYDate, 'CLNY not started');
    require (tokenIds.length != 0, 'Empty array');
    updatePool(CLNYAddress);
    for (uint8 i = 0; i < tokenIds.length; i++) {
      require (msg.sender == MintBurnInterface(MCAddress).ownerOf(tokenIds[i]));
      claimClnyWithoutPoolUpdate(tokenIds[i], CLNYAddress);
    }
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyDAO {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }
}
