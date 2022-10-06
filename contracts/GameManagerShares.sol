// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';
import './Shares.sol';
import './interfaces/IGameManager.sol';
import './interfaces/IOwnable.sol';
import './interfaces/IEnums.sol';
import './libraries/MissionLibrary.sol';

/**
 * Game logic; upgradable
 */
contract GameManagerShares is IGameManager, PausableUpgradeable, Shares {
  // 25 256bit slots in Shares.sol
  uint256[25] private ______gm_gap_0;

  address reserved0; // owner

  address reserved1;
  address reserved2;
  uint256 public price;
  address reserved3;
  uint256 public maxTokenId;
  address reserved5;
  address reserved6;
  uint256 reserved7;

  address reserved8;
  address reserved9;
  address public backendSigner;
  mapping(bytes32 => bool) private usedSignatures;

  bool public allowlistOnly;
  mapping(address => bool) private allowlist;
  uint256 public allowlistLimit;

  struct ReferrerSettings {
    uint64 discount;
    uint64 reward;
  }

  mapping(address => mapping(address => bool)) referrals;
  mapping(address => uint256) public referralsCount;
  mapping(address => uint256) public referrerEarned;
  mapping(address => ReferrerSettings) public referrerSettings;
  mapping(address => address) public referrers;

  address reserved11;

  struct AvailableRarities {
    uint64 common;
    uint64 rare;
    uint64 legendary;
  }
  mapping(address => AvailableRarities) public lootBoxesToMint;

  address reserved12;

  uint256[34] private ______gm_gap_1;

  struct LandData {
    uint256 deprecated1;
    uint64 deprecated2;
    uint8 baseStation; // 0 or 1
    uint8 transport; // 0 or 1, 2, 3 (levels)
    uint8 robotAssembly; // 0 or 1, 2, 3 (levels)
    uint8 powerProduction; // 0 or 1, 2, 3 (levels)
  }

  mapping(uint256 => LandData) private tokenData;

  mapping(uint256 => PlaceOnLand) public baseStationsPlacement;
  mapping(uint256 => PlaceOnLand) public transportPlacement;
  mapping(uint256 => PlaceOnLand) public robotAssemblyPlacement;
  mapping(uint256 => PlaceOnLand) public powerProductionPlacement;

  bool internal locked;

  mapping(uint256 => uint256) public landMissionEarnings;

  uint256[44] private ______gm_gap_2;

  event Airdrop(address indexed receiver, uint256 indexed tokenId);
  // f9917faa5009c58ed8bd6a1c70b79e1fbefc8afe3e7142ba8b854ccb887fb262
  event BuildBaseStation(uint256 tokenId, address indexed owner);
  // bce74c3d6a81a6ea4b55a703751c4fbad439c2ce8997bc12bb2463cb3f6d987b
  event BuildTransport(uint256 tokenId, address indexed owner, uint8 level);
  // 6f4c6fa65abfbdb878065cf56239c87467b1308866c1f27dad012e666a589b68
  event BuildRobotAssembly(uint256 tokenId, address indexed owner, uint8 level);
  // 9914b04dac571a45d7a7b33184088cbd4d62a2ed88e64602a6b8a6a93b3fb0a6
  event BuildPowerProduction(uint256 tokenId, address indexed owner, uint8 level);
  event SetPrice(uint256 price);
  event MissionReward(
    uint256 indexed landId,
    uint256 indexed avatarId,
    uint256 indexed rewardType,
    uint256 rewardAmount
  );

  modifier onlyOwner() {
    require(msg.sender == d.owner(), 'Only owner');
    _;
  }

  modifier onlyTokenOwner(uint256 tokenId) {
    require(IOwnable(address(d.mc())).ownerOf(tokenId) == msg.sender, "You aren't the token owner");
    _;
  }

  modifier nonReentrant() {
    require(!locked, 'reentrancy guard');
    locked = true;
    _;
    locked = false;
  }

  function setClnyPerSecond(uint256 newSpeed) external onlyOwner {
    updatePool();
    clnyPerSecond = newSpeed;
  }

  // function saleData() external view returns (bool allowed, uint256 minted, uint256 limit) {
  //   allowed = !allowlistOnly || allowlist[msg.sender];
  //   minted = IERC721Enumerable(address(d.mc())).totalSupply();
  //   limit = allowlistLimit;
  // }

  function setDependencies(IDependencies addr) external {
    require(address(d) == address(0) || d.owner() == msg.sender);
    d = addr;
  }

  function proceedFinishMissionMessage(string calldata message) private {
    (ICollectionManager collectionManager, IMartianColonists martianColonists, ILootboxes lootboxes, ICLNY clny) = d
      .getCmMclLbClny();

    (
      uint256 _avatar,
      uint256 _land,
      uint256 _xp,
      uint256 _lootbox,
      uint256 _avatarReward,
      uint256 _landReward
    ) = MissionLibrary.getAssetsFromFinishMissionMessage(message);

    collectionManager.addXP(_avatar, _xp);

    if (_lootbox >= 1 && _lootbox <= 3) {
      address avatarOwner = martianColonists.ownerOf(_avatar);

      lootboxes.mint(avatarOwner, MissionLibrary.getLootboxRarity(_lootbox));
    }

    if (_lootbox == 23) {
      lootBoxesToMint[msg.sender].common++;
    }

    if (_lootbox == 24) {
      lootBoxesToMint[msg.sender].rare++;
    }

    if (_lootbox == 25) {
      lootBoxesToMint[msg.sender].legendary++;
    }

    uint256 landOwnerClnyReward = (_landReward * 10**18) / 100;
    landMissionEarnings[_land] += landOwnerClnyReward;

    uint256 avatarClnyReward = (_avatarReward * 10**18) / 100;
    clny.mint(martianColonists.ownerOf(_avatar), avatarClnyReward, REASON_MISSION_REWARD);

    // one event for every reward type
    emit MissionReward(_land, _avatar, 0, _xp); // 0 - xp
    emit MissionReward(_land, _avatar, 100_000 + _lootbox, 1); // 1000xx - lootboxes
    emit MissionReward(_land, _avatar, 1, avatarClnyReward); // 1 - avatar CLNY reward
    emit MissionReward(_land, _avatar, 2, landOwnerClnyReward); // 2 - land owner CLNY reward
  }

  function mintLootbox() external {
    ILootboxes lootboxes = d.lootboxes();
    if (lootBoxesToMint[msg.sender].legendary > 0) {
      lootBoxesToMint[msg.sender].legendary--;
      lootboxes.mint(msg.sender, IEnums.Rarity.LEGENDARY);
    } else if (lootBoxesToMint[msg.sender].rare > 0) {
      lootBoxesToMint[msg.sender].rare--;
      lootboxes.mint(msg.sender, IEnums.Rarity.RARE);
    } else if (lootBoxesToMint[msg.sender].common > 0) {
      lootBoxesToMint[msg.sender].common--;
      lootboxes.mint(msg.sender, IEnums.Rarity.COMMON);
    } else {
      revert('you cannot mint lootbox');
    }
  }

  function finishMission(
    string calldata message,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external {
    MissionLibrary.checkSigner(message, v, r, s, d.backendSigner());

    bytes32 signatureHashed = keccak256(abi.encodePacked(v, r, s));
    require(!usedSignatures[signatureHashed], 'signature has been used');

    proceedFinishMissionMessage(message);

    usedSignatures[signatureHashed] = true;
  }

  function initialize(IDependencies _d) public initializer {
    d = _d;
    __Pausable_init();
    maxTokenId = 21000;
    price = 250 ether;
  }

  /**
   * Cost of minting for `tokenCount` tokens
   * 0xfcee45f4
   */
  function _getFee(uint256 tokenCount, address referrer) private view returns (uint256) {
    uint256 fee = price * tokenCount;

    if (referrer == address(0)) {
      referrer = referrers[msg.sender];
    }

    // no referrer in function args and no referrer stored in past
    if (referrer == address(0)) {
      return fee;
    }

    uint64 discount = referrerSettings[referrer].discount;
    if (discount == 0) discount = 10; // default value

    uint256 feeWithDiscount = fee - (fee * discount) / 100;
    return feeWithDiscount;
  }

  function getFee(uint256 tokenCount) external view returns (uint256) {
    return _getFee(tokenCount, address(0));
  }

  function getFee(uint256 tokenCount, address referrer) public view returns (uint256) {
    if (referrer == msg.sender) {
      return _getFee(tokenCount, address(0));
    }
    return _getFee(tokenCount, referrer);
  }

  /**
   * Sets the cost of minting for 1 token
   */
  function setPrice(uint256 _price) external onlyOwner {
    require(_price >= 0.01 ether && _price <= 10000 ether, 'New price is out of bounds');
    price = _price;
    emit SetPrice(_price);
  }

  function mintAvatar() external nonReentrant {
    (ICollectionManager collectionManager, ICLNY clny) = d.getCollectionManagerClny();

    // artist and team minting royalties
    clny.mint(0x2581A6C674D84dAD92A81E8d3072C9561c21B935, (AVATAR_MINT_COST * 3) / 100, REASON_CREATORS_ROYALTY);
    clny.mint(ARTIST1_ROYALTY_WALLET, (AVATAR_MINT_COST * 3) / 100, REASON_ARTIST_ROYALTY);
    clny.burn(msg.sender, AVATAR_MINT_COST, REASON_MINT_AVATAR);
    collectionManager.mint(msg.sender);
  }

  function mintLand(address _address, uint256 tokenId) private {
    IMC mc = d.mc();
    require(tokenId > 0 && tokenId <= maxTokenId, 'Token id out of bounds');
    // if (allowlistOnly) {
    //   require(allowlist[msg.sender], 'you are not in allowlist');
    //   require(IERC721Enumerable(address(mc)).totalSupply() < allowlistLimit, 'Presale limit has ended');
    // }
    setInitialShare(tokenId);
    mc.mint(_address, tokenId);
  }

  /**
   * Mints several tokens
   */
  function _claim(uint256[] calldata tokenIds, address referrer) internal whenNotPaused {
    if (referrer != address(0)) {
      setReferrer(referrer);
    } else if (referrers[msg.sender] != address(0)) {
      referrer = referrers[msg.sender];
    }

    uint256 fee = getFee(tokenIds.length, referrer);

    require(msg.value == fee, 'Wrong claiming fee');
    updatePool();
    for (uint256 i = 0; i < tokenIds.length; i++) {
      mintLand(msg.sender, tokenIds[i]);
    }

    bool success;
    if (referrer == address(0)) {
      // 0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4 - creatorsDAO
      (success, ) = payable(0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4).call{value: msg.value}('');
      require(success, 'Transfer failed');
      return;
    }

    // we have a referrer, pay shares to dao and to referrer
    uint64 referrerReward = referrerSettings[referrer].reward;
    if (referrerReward == 0) referrerReward = 20; // 20% referal reward by default

    uint256 referrerValueShare = (msg.value * (referrerReward)) / 100;
    uint256 daoValueShare = msg.value - referrerValueShare;

    // 0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4 - creatorsDAO
    (success, ) = payable(0x7162DF6d2c1be22E61b19973Fe4E7D086a2DA6A4).call{value: daoValueShare}('');
    require(success, 'Transfer failed');

    (success, ) = payable(referrer).call{value: referrerValueShare}('');
    require(success, 'Transfer failed');

    referrerEarned[referrer] += referrerValueShare;
  }

  function claim(uint256[] calldata tokenIds) external payable nonReentrant whenNotPaused {
    _claim(tokenIds, address(0));
  }

  function claim(uint256[] calldata tokenIds, address referrer) external payable nonReentrant whenNotPaused {
    if (referrer == msg.sender) {
      _claim(tokenIds, address(0));
      return;
    }
    _claim(tokenIds, referrer);
  }

  /**
   * 0x8456cb59
   */
  function pause() external onlyOwner {
    (ICollectionManager collectionManager, ICLNY clny, IMC mc) = d.getCollectionManagerClnyMc();
    _pause();
    clny.pause();
    mc.pause();
    if (address(collectionManager) != address(0)) {
      collectionManager.pause();
    }
  }

  /**
   * 0x3f4ba83a
   */
  function unpause() external onlyOwner {
    (ICollectionManager collectionManager, ICLNY clny, IMC mc) = d.getCollectionManagerClnyMc();
    _unpause();
    clny.unpause();
    mc.unpause();
    if (address(collectionManager) != address(0)) {
      collectionManager.unpause();
    }
  }

  function airdrop(address receiver, uint256 tokenId) external whenNotPaused onlyOwner {
    mintLand(receiver, tokenId);
    emit Airdrop(receiver, tokenId);
  }

  uint8 constant BASE_STATION = 0;
  /** these constants (for sure just `_deduct` function) can be changed while upgrading */
  uint256 constant BASE_STATION_COST = 30 * 10**18;
  uint256 constant AVATAR_MINT_COST = 90 * 10**18;
  uint256 constant LEVEL_1_COST = 60 * 10**18;
  uint256 constant LEVEL_2_COST = 120 * 10**18;
  uint256 constant LEVEL_3_COST = 240 * 10**18;
  uint256 constant RENAME_AVATAR_COST = 25 * 10**18;
  uint256 constant PLACEMENT_COST = 5 * 10**18;

  /**
   * Burn CLNY token for building enhancements
   * Assume decimals() is always 18
   */
  function _deduct(uint8 level, uint256 reason) private {
    uint256 amount = 0;
    if (level == BASE_STATION) {
      amount = BASE_STATION_COST;
    }
    if (level == 1) {
      amount = LEVEL_1_COST;
    }
    if (level == 2) {
      amount = LEVEL_2_COST;
    }
    if (level == 3) {
      amount = LEVEL_3_COST;
    }
    require(amount > 0, 'Wrong level');
    d.clny().burn(msg.sender, amount, reason);
  }

  function getPassiveEarningSpeed(uint256 tokenId) public view returns (uint256 shareCount) {
    return landInfo[tokenId].share;
    // shares from powerproduction are excluded from passive speed
    // shareCount = landInfo[tokenId].share;
    // shareCount = shareCount - tokenData[tokenId].powerProduction;
    // if (tokenData[tokenId].powerProduction == 3) {
    //   shareCount = shareCount - 1; // one more share for pp lvl3
    // }
  }

  // View function to see pending ColonyToken on frontend
  /* 0xe9387504 */
  function getEarned(uint256 landId) public view returns (uint256) {
    if (lastRewardTime < startCLNYDate) {
      return 0;
    }
    if (lastRewardTime == 0) {
      return 0;
    }
    uint256 activeShares = getPassiveEarningSpeed(landId);
    uint256 _accColonyPerShare = accColonyPerShare;
    if (block.timestamp > lastRewardTime && totalShare != 0) {
      uint256 clnyReward = (block.timestamp - lastRewardTime) * clnyPerSecond;
      _accColonyPerShare = _accColonyPerShare + (clnyReward * 1e12) / totalShare;
    }
    // we need to treat 0 as 1 because we migrate from allowlist and no-share minting
    return ((activeShares == 0 ? 1 : activeShares) * _accColonyPerShare) / 1e12 - landInfo[landId].rewardDebt;
  }

  /* 0xfd5da729 */
  function getEarningSpeed(uint256 tokenId) public view returns (uint256) {
    // for polygon it is for shares
    return landInfo[tokenId].share;
  }

  /**
   * Builds base station
   * deprecated: new base stations should be placed with buildAndPlaceBaseStation
   * 0xcfc26d99
   */
  function buildBaseStation(uint256 tokenId) public onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].baseStation == 0, 'There is already a base station');
    addToShare(tokenId, 1);
    tokenData[tokenId].baseStation = 1;
    _deduct(BASE_STATION, REASON_UPGRADE);
    emit BuildBaseStation(tokenId, msg.sender);
  }

  /**
   * Builds and places base station
   * 0x23c32819
   */
  function buildAndPlaceBaseStation(
    uint256 tokenId,
    uint32 x,
    uint32 y
  ) external {
    baseStationsPlacement[tokenId].x = x;
    baseStationsPlacement[tokenId].y = y;
    buildBaseStation(tokenId);
  }

  /**
   * Places base station
   * deprecated: new base stations should be placed with buildAndPlaceBaseStation
   * 0x5f549163
   */
  function placeBaseStation(
    uint256 tokenId,
    uint32 x,
    uint32 y,
    bool free
  ) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].baseStation != 0, 'There should be a base station');
    if (baseStationsPlacement[tokenId].x != 0 || baseStationsPlacement[tokenId].y != 0) {
      require(!free, 'You can place only for CLNY now');
      baseStationsPlacement[tokenId].x = x;
      baseStationsPlacement[tokenId].y = y;
      // already placed -> new placement is for 5 clny
      // if users places back to 0, 0 it's ok not to deduct him 5 clny
      d.clny().burn(msg.sender, PLACEMENT_COST, REASON_PLACE);
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
    addToShare(tokenId, level == 3 ? 2 : 1); // level 3 gives +2 shares
    tokenData[tokenId].transport = level;
    _deduct(level, REASON_UPGRADE);
    emit BuildTransport(tokenId, msg.sender, level);
  }

  /**
   * Builds and places transport
   * 0x2fc6ced1
   */
  function buildAndPlaceTransport(
    uint256 tokenId,
    uint32 x,
    uint32 y
  ) external {
    transportPlacement[tokenId].x = x;
    transportPlacement[tokenId].y = y;
    buildTransport(tokenId, 1);
  }

  /**
   * Places transport
   * deprecated: for migration only
   * 0x9b416e1c
   */
  function placeTransport(
    uint256 tokenId,
    uint32 x,
    uint32 y,
    bool free
  ) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].transport != 0, 'There should be a transport');
    if (transportPlacement[tokenId].x != 0 || transportPlacement[tokenId].y != 0) {
      require(!free, 'You can place only for CLNY now');
      transportPlacement[tokenId].x = x;
      transportPlacement[tokenId].y = y;
      // already placed -> new placement is for 5 clny
      // if users places back to 0, 0 it's ok not to deduct him 5 clny
      d.clny().burn(msg.sender, PLACEMENT_COST, REASON_PLACE);
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
    addToShare(tokenId, level == 3 ? 2 : 1); // level 3 gives +2 shares
    tokenData[tokenId].robotAssembly = level;
    _deduct(level, REASON_UPGRADE);
    emit BuildRobotAssembly(tokenId, msg.sender, level);
  }

  /**
   * Builds and places robot assembly
   * 0xbd09376f
   */
  function buildAndPlaceRobotAssembly(
    uint256 tokenId,
    uint32 x,
    uint32 y
  ) external {
    robotAssemblyPlacement[tokenId].x = x;
    robotAssemblyPlacement[tokenId].y = y;
    buildRobotAssembly(tokenId, 1);
  }

  /**
   * Places Robot Assembly
   * deprecated: for migration only
   * 0x15263117
   */
  function placeRobotAssembly(
    uint256 tokenId,
    uint32 x,
    uint32 y,
    bool free
  ) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].robotAssembly != 0, 'There should be a robot assembly');
    if (robotAssemblyPlacement[tokenId].x != 0 || robotAssemblyPlacement[tokenId].y != 0) {
      require(!free, 'You can place only for CLNY now');
      robotAssemblyPlacement[tokenId].x = x;
      robotAssemblyPlacement[tokenId].y = y;
      // already placed -> new placement is for 5 clny
      // if users places back to 0, 0 it's ok not to deduct him 5 clny
      d.clny().burn(msg.sender, PLACEMENT_COST, REASON_PLACE);
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
    addToShare(tokenId, level == 3 ? 2 : 1); // level 3 gives +2 shares
    tokenData[tokenId].powerProduction = level;
    _deduct(level, REASON_UPGRADE);
    emit BuildPowerProduction(tokenId, msg.sender, level);
  }

  /**
   * Builds and places power production
   * 0x88cb482a
   */
  function buildAndPlacePowerProduction(
    uint256 tokenId,
    uint32 x,
    uint32 y
  ) external {
    powerProductionPlacement[tokenId].x = x;
    powerProductionPlacement[tokenId].y = y;
    buildPowerProduction(tokenId, 1);
  }

  /**
   * Places Power Production
   * deprecated: for migration only
   * 0x9452cff2
   */
  function placePowerProduction(
    uint256 tokenId,
    uint32 x,
    uint32 y,
    bool free
  ) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].powerProduction != 0, 'There should be a power production');
    if (powerProductionPlacement[tokenId].x != 0 || powerProductionPlacement[tokenId].y != 0) {
      require(!free, 'You can place only for CLNY now');
      powerProductionPlacement[tokenId].x = x;
      powerProductionPlacement[tokenId].y = y;
      // already placed -> new placement is for 5 clny
      // if users places back to 0, 0 it's ok not to deduct him 5 clny
      d.clny().burn(msg.sender, PLACEMENT_COST, REASON_PLACE);
    } else {
      powerProductionPlacement[tokenId].x = x;
      powerProductionPlacement[tokenId].y = y;
    }
  }

  function getEarningData(uint256[] memory tokenIds) external view returns (uint256, uint256) {
    uint256 result = 0;
    uint256 speed = 0;
    for (uint256 i = 0; i < tokenIds.length; i++) {
      result = result + getEarned(tokenIds[i]);
      speed = speed + getEarningSpeed(tokenIds[i]);
    }
    return (result, speed);
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
    require(block.timestamp > startCLNYDate, 'CLNY not started');

    (address treasury, address liquidity, ICLNY clny, IMC mc) = d.getTreasuryLiquidityClnyMc();

    updatePool();

    uint256 toUser = 0;
    for (uint256 i = 0; i < tokenIds.length; i++) {
      require(msg.sender == IOwnable(address(mc)).ownerOf(tokenIds[i]));
      toUser = toUser + claimClnyWithoutPoolUpdate(tokenIds[i], clny);
    }

    clny.mint(treasury, (toUser * 31) / 49, REASON_TREASURY);
    clny.mint(liquidity, (toUser * 20) / 49, REASON_LP_POOL);
  }

  // referrers

  function setReferrerSettings(
    address referrer,
    uint64 discount,
    uint64 reward
  ) external onlyOwner {
    referrerSettings[referrer] = ReferrerSettings({discount: discount, reward: reward});
  }

  function setReferrer(address referrer) private {
    require(referrer != address(0), 'referrer can not be 0');
    referrers[msg.sender] = referrer;
    referrals[referrer][msg.sender] = true;
    referralsCount[referrer]++;
  }

  function purchaseCryochamber() external {
    (ICryochamber cryochamber, ICLNY clny) = d.getCryochamberClny();
    cryochamber.purchaseCryochamber(msg.sender);

    uint256 cryochamberPrice = cryochamber.cryochamberPrice();
    clny.burn(msg.sender, cryochamberPrice, REASON_PURCHASE_CRYOCHAMBER);
  }

  function purchaseCryochamberEnergy(uint256 amount) external {
    (ICryochamber cryochamber, ICLNY clny) = d.getCryochamberClny();
    cryochamber.purchaseCryochamberEnergy(msg.sender, amount);

    uint256 energyPrice = cryochamber.energyPrice();
    clny.burn(msg.sender, energyPrice * amount, REASON_PURCHASE_CRYOCHAMBER_ENERGY);
  }

  function renameAvatar(uint256 avatarId, string calldata _name) external {
    (ICollectionManager collectionManager, IMartianColonists martianColonists, ICLNY clny) = d.getCmMclClny();

    require(martianColonists.ownerOf(avatarId) == msg.sender, 'You are not the owner');
    collectionManager.setNameByGameManager(avatarId, _name);
    clny.burn(msg.sender, RENAME_AVATAR_COST, REASON_RENAME_AVATAR);
  }

  function withdrawToken(
    address _tokenContract,
    address _whereTo,
    uint256 _amount
  ) external onlyOwner {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }
}
