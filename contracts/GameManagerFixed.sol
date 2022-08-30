// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './interfaces/TokenInterface.sol';
import './interfaces/PauseInterface.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IMartianColonists.sol';
import './interfaces/ICollectionManager.sol';
import './interfaces/ICryochamber.sol';
import './interfaces/ILootboxes.sol';
import './interfaces/IGameManager.sol';
import './Constants.sol';
import './interfaces/IEnums.sol';



/**
 * Game Manager; fixed (harmony-like economy)
 */
contract GameManagerFixed is IGameManager, PausableUpgradeable, Constants {
  uint256[50] private ______gm_gap_0;

  address public DAO; // owner

  address public treasury;
  address public liquidity;
  uint256 public price;
  address public CLNYAddress;
  uint256 public maxTokenId;
  address public MCAddress;
  address public collectionAddress;
  uint256 reserved0;
  address public missionManager;
  IMartianColonists public martianColonists;
  address public backendSigner;
  mapping (bytes32 => bool) private usedSignatures;
  address public lootboxesAddress;


  struct AvailableRarities {
    uint64 common;
    uint64 rare;
    uint64 legendary;
  }
  mapping (address => AvailableRarities) public lootBoxesToMint;
  
  address public cryochamberAddress;

  uint256[41] private ______gm_gap_1;

  struct LandData {
    uint256 fixedEarnings; // already earned CLNY, but not withdrawn yet
    uint64 lastCLNYCheckout; // (now - lastCLNYCheckout) * 'earning speed' + fixedEarnings = farmed so far
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

  mapping(uint256 => uint256) public landMissionEarnings;

  uint256[44] private ______gm_gap_2;

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
  event MissionReward (uint256 indexed landId, uint256 indexed avatarId, uint256 indexed rewardType, uint256 rewardAmount);

  modifier onlyDAO {
    require(msg.sender == DAO, 'Only DAO');
    _;
  }

  modifier onlyTokenOwner(uint256 tokenId) {
    require(TokenInterface(MCAddress).ownerOf(tokenId) == msg.sender, "You aren't the token owner");
    _;
  }

  modifier nonReentrant {
    require (!locked, 'reentrancy guard');
    locked = true;
    _;
    locked = false;
  }

  // for compatibility with Polygon version
  function saleData() external pure returns (bool allowed, uint256 minted, uint256 limit) {
    return (true, 0, 0);
  }

  function setBackendSigner(address _address) external onlyDAO {
    backendSigner = _address;
  }

  function setCollectionAddress(address _collectionAddress) external onlyDAO {
    collectionAddress = _collectionAddress;
  }

  function setMissionManager(address _address) external onlyDAO {
    missionManager = _address;
  }

  function setLootboxesAddress(address _address) external onlyDAO {
    lootboxesAddress = _address;
  }

  function setMartianColonists(address _address) external onlyDAO {
    martianColonists = IMartianColonists(_address);
  }


  function stringToUint(string memory s) private pure returns (uint256) {
    bytes memory b = bytes(s);
    uint result = 0;
    for (uint i = 0; i < b.length; i++) {
      if (uint8(b[i]) >= 48 && uint8(b[i]) <= 57) {
        result = result * 10 + (uint8(b[i]) - 48);
      }
    }
    return result;
  }

  function _getSignerAddress(
    string memory message,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) private pure returns (address signer) {
    string memory header = '\x19Ethereum Signed Message:\n000000';
    uint256 lengthOffset;
    uint256 length;
    assembly {
      length := mload(message)
      lengthOffset := add(header, 57)
    }

    require(length <= 999999);

    uint256 lengthLength = 0;
    uint256 divisor = 100000;

    while (divisor != 0) {
      uint256 digit = length / divisor;
      if (digit == 0) {
        if (lengthLength == 0) {
          divisor /= 10;
          continue;
        }
      }

      lengthLength++;
      length -= digit * divisor;
      divisor /= 10;
      digit += 0x30;
      lengthOffset++;

      assembly {
        mstore8(lengthOffset, digit)
      }
    }

    if (lengthLength == 0) {
      lengthLength = 1 + 0x19 + 1;
    } else {
      lengthLength += 1 + 0x19;
    }

    assembly {
      mstore(header, lengthLength)
    }

    bytes32 check = keccak256(abi.encodePacked(header, message));

    return ecrecover(check, v, r, s);
  }

  function _substring(string memory str, uint startIndex, uint endIndex) private pure returns (uint256 ) {
    bytes memory strBytes = bytes(str);
    bytes memory result = new bytes(endIndex-startIndex);
    for(uint i = startIndex; i < endIndex; i++) {
      result[i - startIndex] = strBytes[i];
    }
    return stringToUint(string(result));
  }

  function getAssetsFromFinishMissionMessage(string calldata message) private pure returns (uint256, uint256, uint256, uint256, uint256, uint256) {
    // 0..<32 - random
    // 32..<37 - avatar id
    // 37..<42 - land id
    // 42..<47 - avatar id (again)
    // 47..<55 - xp reward like 00000020
    // 55..<57 - lootbox
    // 57..<61 - avatar mission rewards in CLNY * 100 / decimals (e.g. 100 = 1 CLNY)
    // 61..<65 - avatar mission rewards in CLNY * 100 / decimals (e.g. 100 = 1 CLNY)
    // 65... and several 8-byte blocks - reserved
    uint256 _avatar = _substring(message, 32, 37);
    uint256 _avatar2 = _substring(message, 37, 42);
    uint256 _land = _substring(message, 42, 47);
    uint256 _xp = _substring(message, 47, 55);
    uint256 _lootbox = _substring(message, 55, 57);
    uint256 _avatarReward = _substring(message, 57, 61);
    uint256 _landReward = _substring(message, 61, 65);
    require(_avatar == _avatar2, 'check failed');
    return (_avatar, _land, _xp, _lootbox, _avatarReward,_landReward );
  }

  function getLootboxRarity(uint256 _lootbox) private pure returns (IEnums.Rarity rarity) {
    if (_lootbox == 1 || _lootbox == 23) return IEnums.Rarity.COMMON;
    if (_lootbox == 2 || _lootbox == 24) return IEnums.Rarity.RARE;
    if (_lootbox == 3 || _lootbox == 25) return IEnums.Rarity.LEGENDARY;
  }

  function proceedFinishMissionMessage(string calldata message) private {
    (uint256 _avatar, uint256 _land, uint256 _xp, uint256 _lootbox, uint256 _avatarReward, uint256 _landReward) = getAssetsFromFinishMissionMessage(message);

    require(_avatar > 0, "AvatarId is not valid");
    require(_land > 0 && _land <= 21000, "LandId is not valid");
    require(_xp >= 230 && _xp < 19971800, "XP increment is not valid");
    require((_lootbox >= 0 && _lootbox <= 3) || (_lootbox >= 23 && _lootbox <= 25), "Lootbox code is not valid");


    ICollectionManager(collectionAddress).addXP(_avatar, _xp);


    if (_lootbox >= 1 && _lootbox <= 3) {
      address avatarOwner = martianColonists.ownerOf(_avatar);

      ILootboxes(lootboxesAddress).mint(avatarOwner, getLootboxRarity(_lootbox));
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

    uint256 landOwnerClnyReward =  _landReward * 10**18 / 100;
    landMissionEarnings[_land] += landOwnerClnyReward;

    uint256 avatarClnyReward = _avatarReward * 10**18 / 100;
    TokenInterface(CLNYAddress).mint(martianColonists.ownerOf(_avatar), avatarClnyReward, REASON_MISSION_REWARD);

    // one event for every reward type
    emit MissionReward(_land, _avatar, 0, _xp); // 0 - xp
    emit MissionReward(_land, _avatar, 100_000 + _lootbox, 1); // 1000xx - lootboxes
    emit MissionReward(_land, _avatar, 1, avatarClnyReward); // 1 - avatar CLNY reward
    emit MissionReward(_land, _avatar, 2, landOwnerClnyReward); // 2- land owner CLNY reward

  }

  function mintLootbox() public {
    if (lootBoxesToMint[msg.sender].legendary > 0) {
      lootBoxesToMint[msg.sender].legendary--;
      ILootboxes(lootboxesAddress).mint(msg.sender, IEnums.Rarity.LEGENDARY);
    } else if (lootBoxesToMint[msg.sender].rare > 0) {
      lootBoxesToMint[msg.sender].rare--;
      ILootboxes(lootboxesAddress).mint(msg.sender, IEnums.Rarity.RARE);
    } else if (lootBoxesToMint[msg.sender].common > 0) {
      lootBoxesToMint[msg.sender].common--;
      ILootboxes(lootboxesAddress).mint(msg.sender, IEnums.Rarity.COMMON);
    } else {
      revert("you cannot mint lootbox");
    }
  }

  function finishMission(
    string calldata message,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external {
    address signerAddress = _getSignerAddress(message, v, r, s);
    require(signerAddress == backendSigner, "Signature is not from server");

    bytes32 signatureHashed = keccak256(abi.encodePacked(v, r, s));
    require (!usedSignatures[signatureHashed], 'signature has been used');

    proceedFinishMissionMessage(message);

    usedSignatures[signatureHashed] = true;
  }

  /**
   * temporary to count burned clny (setBurned)
   */
  function getBurnedOnEnhancements() external view returns (uint256) {
    uint256 result = 0;
    for (uint256 i = 1; i <= 21000; i++) {
      LandData memory data = tokenData[i];
      if (data.baseStation != 0) {
        result = result + 30;
      }

      if (data.powerProduction == 1) {
        result = result + 120;
      } else if (data.powerProduction == 2) {
        result = result + 120 + 270;
      } else if (data.powerProduction == 3) {
        result = result + 120 + 270 + 480;
      }

      if (data.transport == 1) {
        result = result + 120;
      } else if (data.transport == 2) {
        result = result + 120 + 270;
      } else if (data.transport == 3) {
        result = result + 120 + 270 + 480;
      }

      if (data.robotAssembly == 1) {
        result = result + 120;
      } else if (data.robotAssembly == 2) {
        result = result + 120 + 270;
      } else if (data.robotAssembly == 3) {
        result = result + 120 + 270 + 480;
      }
    }
    return result;
  }

  function initialize(
    address _CLNYAddress,
    address _MCAddress,
    address _treasury,
    address _liquidity
  ) public initializer {
    __Pausable_init();
    DAO = msg.sender;
    CLNYAddress = _CLNYAddress;
    MCAddress = _MCAddress;
    maxTokenId = 21000;
    price = 250 ether;
    treasury = _treasury;
    liquidity = _liquidity;
  }

  /**
   * Cost of minting for `tokenCount` tokens
   */
  function getFee(uint256 tokenCount) public view returns (uint256) {
    return price * tokenCount;
  }

  // no referral program on master yet; for abi compatibility with Polygon version
  function getFee(uint256 tokenCount, address referrer) public view returns (uint256) {
    referrer;
    return getFee(tokenCount);
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
    TokenInterface(collectionAddress).mint(msg.sender);
  }

  function mintLand(address _address, uint256 tokenId) private {
    require (tokenId > 0 && tokenId <= maxTokenId, 'Token id out of bounds');
    tokenData[tokenId].lastCLNYCheckout = uint64(block.timestamp);
    TokenInterface(MCAddress).mint(_address, tokenId);
  }

  /**
   * Mints several tokens
   * Pls check gas limits to get max possible count
   */
  function claim(uint256[] calldata tokenIds) public payable whenNotPaused {
    require (tokenIds.length != 0, "You can't claim 0 tokens");
    require (msg.value == getFee(tokenIds.length), 'Wrong claiming fee');
    for (uint8 i = 0; i < tokenIds.length; i++) {
      mintLand(msg.sender, tokenIds[i]);
    }
  }

  // no referral program on master yet; for abi compatibility with Polygon version
  function claim(uint256[] calldata tokenIds, address referrer) external payable nonReentrant whenNotPaused {
    claim(tokenIds);
    referrer;
  }

  /**
   * 0x8456cb59
   */
  function pause() external onlyDAO {
    _pause();
    PauseInterface(CLNYAddress).pause();
    PauseInterface(MCAddress).pause();
    if (collectionAddress != address(0)) {
      PauseInterface(collectionAddress).pause();
    }
  }

  /**
   * 0x3f4ba83a
   */
  function unpause() external onlyDAO {
    _unpause();
    PauseInterface(CLNYAddress).unpause();
    PauseInterface(MCAddress).unpause();
    if (collectionAddress != address(0)) {
      PauseInterface(collectionAddress).unpause();
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
  uint256 constant RENAME_AVATAR_COST = 25 * 10 ** 18;
  uint8 constant MINT_AVATAR_LEVEL = 254;
  uint8 constant PLACEMENT_LEVEL = 255;
  uint256 constant PLACEMENT_COST = 5;

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
      TokenInterface(CLNYAddress).mint(
        0x2581A6C674D84dAD92A81E8d3072C9561c21B935,
        AVATAR_MINT_COST * 10 ** 18 * 3 / 100,
        REASON_ROYALTY
      );
    }
    require (amount > 0, 'Wrong level');
    TokenInterface(CLNYAddress).burn(msg.sender, amount, reason);
  }

  function getLastCheckout(uint256 tokenId) public view returns (uint256) {
    return tokenData[tokenId].lastCLNYCheckout;
  }

  function getEarned(uint256 tokenId) public view returns (uint256) {
    return getPassiveEarningSpeed(tokenId)
      * (block.timestamp - getLastCheckout(tokenId)) * 10 ** 18 / (24 * 60 * 60)
      + tokenData[tokenId].fixedEarnings + landMissionEarnings[tokenId];
  }

  /**
   * deprecated, use getAttributesMany
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

  function getEarningSpeed(uint256 tokenId) public view returns (uint256) {
    require (TokenInterface(MCAddress).ownerOf(tokenId) != address(0)); // reverts itself
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

  function getPassiveEarningSpeed(uint256 tokenId) public view returns (uint256) {
    require (TokenInterface(MCAddress).ownerOf(tokenId) != address(0)); // reverts itself
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
    // no Power Production here
    return speed;
  }

  function fixEarnings(uint256 tokenId) private {
    tokenData[tokenId].fixedEarnings = getEarned(tokenId) - landMissionEarnings[tokenId];
    tokenData[tokenId].lastCLNYCheckout = uint64(block.timestamp);
  }

  /**
   * Builds base station
   * deprecated: new base stations should be placed with buildAndPlaceBaseStation
   * 0xcfc26d99
   */
  function buildBaseStation(uint256 tokenId) public onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].baseStation == 0, 'There is already a base station');
    fixEarnings(tokenId);
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
    require(tokenData[tokenId].transport == level - 1, 'Can buy only next level');
    fixEarnings(tokenId);
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
    require(tokenData[tokenId].robotAssembly == level - 1, 'Can buy only next level');
    fixEarnings(tokenId);
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
    require(tokenData[tokenId].powerProduction == level - 1, 'Can buy only next level');
    fixEarnings(tokenId);
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
   */
  function getEnhancements(uint256 tokenId) external view returns (uint8, uint8, uint8, uint8) {
    return (
      tokenData[tokenId].baseStation,
      tokenData[tokenId].transport,
      tokenData[tokenId].robotAssembly,
      tokenData[tokenId].powerProduction
    );
  }

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
    require (tokenIds.length != 0, 'Empty array');
    for (uint8 i = 0; i < tokenIds.length; i++) {
      require (msg.sender == TokenInterface(MCAddress).ownerOf(tokenIds[i]));
      uint256 earned = getEarned(tokenIds[i]);
      tokenData[tokenIds[i]].fixedEarnings = 0;
      landMissionEarnings[tokenIds[i]] = 0;
      tokenData[tokenIds[i]].lastCLNYCheckout = uint64(block.timestamp);
      TokenInterface(CLNYAddress).mint(msg.sender, earned, REASON_EARNING);
      TokenInterface(CLNYAddress).mint(treasury, earned * 31 / 49, REASON_TREASURY);
      TokenInterface(CLNYAddress).mint(liquidity, earned * 20 / 49, REASON_LP_POOL);
    }
  }

  function fixEarnings(uint256[] calldata tokenIds) external onlyDAO {
    for (uint i = 0; i < tokenIds.length; i++) {
      TokenInterface(MCAddress).ownerOf(tokenIds[i]); // reverts if not minted
      fixEarnings(tokenIds[i]);
    }
  }

  
  function purchaseCryochamber() external {
    ICryochamber(cryochamberAddress).purchaseCryochamber(msg.sender);

    uint256 cryochamberPrice = ICryochamber(cryochamberAddress).cryochamberPrice();
    TokenInterface(CLNYAddress).burn(msg.sender, cryochamberPrice, REASON_PURCHASE_CRYOCHAMBER);

  }

  function purchaseCryochamberEnergy(uint256 amount) external {
    ICryochamber(cryochamberAddress).purchaseCryochamberEnergy(msg.sender, amount);

    uint256 energyPrice = ICryochamber(cryochamberAddress).energyPrice();
    TokenInterface(CLNYAddress).burn(msg.sender, energyPrice * amount, REASON_PURCHASE_CRYOCHAMBER_ENERGY);
  }

  function renameAvatar(uint256 avatarId, string calldata _name) external {
    require(martianColonists.ownerOf(avatarId) == msg.sender, 'You are not the owner');
    ICollectionManager(collectionAddress).setNameByGameManager(avatarId, _name);
    TokenInterface(CLNYAddress).burn(msg.sender, RENAME_AVATAR_COST, REASON_RENAME_AVATAR);
  }


  // gears

  function openLootbox(uint256 tokenId) external whenNotPaused {

    require(TokenInterface(lootboxesAddress).ownerOf(tokenId) == msg.sender, "You aren't this lootbox owner");

    IEnums.Rarity rarity = ILootboxes(lootboxesAddress).rarities(tokenId);

    (uint256 commonPrice, uint256 rarePrice, uint256 legendaryPrice) = ICollectionManager(collectionAddress).getLootboxOpeningPrice();
    uint256 openPrice;
    
    if (rarity == IEnums.Rarity.COMMON) {
      openPrice = commonPrice;
    }
    
    if (rarity == IEnums.Rarity.RARE) {
      openPrice = rarePrice;
    }

    if (rarity == IEnums.Rarity.LEGENDARY) {
      openPrice = legendaryPrice;
    }

    TokenInterface(CLNYAddress).burn(msg.sender, openPrice, REASON_OPEN_LOOTBOX);
    ILootboxes(lootboxesAddress).burn(tokenId);

    ICollectionManager(collectionAddress).mintGear(msg.sender, rarity);
  }

  // for compatibility with Polygon
  function maxLandShares() external pure returns (uint256) {
    return 0;
  }

  function clnyPerSecond() external pure returns (uint256) {
    return 0;
  }

  function totalShare() external pure returns (uint256) {
    return 0;
  }

  /**
   * 0x91cdd9f0
   */
  function withdrawValue(uint256 value) external onlyDAO {
    require (address(this).balance != 0, 'Nothing to withdraw');
    (bool success, ) = payable(DAO).call{ value: value }('');
    require(success, 'Withdraw failed');
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyDAO {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }

}
