// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './interfaces/NFTMintableInterface.sol';
import './interfaces/PauseInterface.sol';
import './interfaces/ERC20MintBurnInterface.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IPoll.sol';
import './interfaces/IMartianColonists.sol';
import './interfaces/IAvatarManager.sol';
import './interfaces/ICryochamber.sol';



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
  address public avatarAddress;
  address public pollAddress;
  address public missionManager;
  IMartianColonists public martianColonists;
  address public backendSigner;
  mapping (bytes32 => bool) private usedSignatures;
  address public cryochamberAddress;

  uint256[43] private ______gm_gap_1;

  struct LandData {
    uint256 fixedEarnings; // already earned CLNY, but not withdrawn yet
    uint64 lastCLNYCheckout; // (now - lastCLNYCheckout) * 'earning speed' + fixedEarnings = farmed so far
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
  event MissionReward (uint256 indexed landId, uint256 indexed avatarId, uint256 indexed rewardType, uint256 rewardAmount);

  modifier onlyDAO {
    require(msg.sender == DAO, 'Only DAO');
    _;
  }

  modifier onlyTokenOwner(uint256 tokenId) {
    require(NFTMintableInterface(MCAddress).ownerOf(tokenId) == msg.sender, "You aren't the token owner");
    _;
  }

  modifier nonReentrant {
    require (!locked, 'reentrancy guard');
    locked = true;
    _;
    locked = false;
  }

  function setMissionManager(address _address) external onlyDAO {
    missionManager = _address;
  }

  function setBackendSigner(address _address) external onlyDAO {
    backendSigner = _address;
  }

  function setMartianColonists(address _address) external onlyDAO {
    martianColonists = IMartianColonists(_address);
  }

  function setAvatarAddress(address _avatarAddress) external onlyDAO {
    avatarAddress = _avatarAddress;
  }

  function setPollAddress(address _address) external onlyDAO {
    pollAddress = _address;
  }

  function setCryochamberAddress(address _address) external onlyDAO {
    cryochamberAddress = _address;
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

  function getAssetsFromFinishMissionMessage(string calldata message) private pure returns (uint256, uint256, uint256) {
    // 0..<32 - random
    // 32..<37 - avatar id
    // 37..<42 - land id
    // 42..<47 - avatar id (again)
    // 47..<55 - xp reward like 00000020
    // 55... and several 8-byte blocks - reserved
    uint256 _avatar = _substring(message, 32, 37);
    uint256 _avatar2 = _substring(message, 37, 42);
    uint256 _land = _substring(message, 42, 47);
    uint256 _xp = _substring(message, 47, 55);
    require(_avatar == _avatar2, 'check failed');
    return (_avatar, _land, _xp);
  }

  function proceedFinishMissionMessage(string calldata message) private {
    (uint256 _avatar, uint256 _land, uint256 _xp) = getAssetsFromFinishMissionMessage(message);

    require(_avatar > 0, "AvatarId is not valid");
    require(_land > 0 && _land <= 21000, "LandId is not valid");
    require(_xp >= 230 && _xp < 19971800, "XP increment is not valid");

    IAvatarManager(avatarAddress).addXP(_avatar, _xp);

    emit MissionReward(_land, _avatar, 0, _xp); // 0 - xp; one event for every reward type
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
    emit SetPrice(_price);
  }

  function mintAvatar() external nonReentrant {
    _deduct(MINT_AVATAR_LEVEL, REASON_MINT_AVATAR);
    NFTMintableInterface(avatarAddress).mint(msg.sender);
  }

  function mintNFT(address _address, uint256 tokenId) private {
    require (tokenId > 0 && tokenId <= maxTokenId, 'Token id out of bounds');
    tokenData[tokenId].lastCLNYCheckout = uint64(block.timestamp);
    NFTMintableInterface(MCAddress).mint(_address, tokenId);
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

  /**
   * 0x8456cb59
   */
  function pause() external onlyDAO {
    _pause();
    PauseInterface(CLNYAddress).pause();
    PauseInterface(MCAddress).pause();
    PauseInterface(avatarAddress).pause();
  }

  /**
   * 0x3f4ba83a
   */
  function unpause() external onlyDAO {
    _unpause();
    PauseInterface(CLNYAddress).unpause();
    PauseInterface(MCAddress).unpause();
    PauseInterface(avatarAddress).unpause();
  }

  function airdrop(address receiver, uint256 tokenId) external whenNotPaused onlyDAO {
    mintNFT(receiver, tokenId);
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
  uint256 constant REASON_PURCHASE_CRYOCHAMBER = 10;
  uint256 constant REASON_PURCHASE_CRYOCHAMBER_ENERGY = 11;

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
      // atrist and team minting royalties
      ERC20MintBurnInterface(CLNYAddress).mint(0x352c478CD91BA54615Cc1eDFbA4A3E7EC9f60EE1, AVATAR_MINT_COST * 10 ** 18 * 2 / 100);
      ERC20MintBurnInterface(CLNYAddress).mint(0x2581A6C674D84dAD92A81E8d3072C9561c21B935, AVATAR_MINT_COST * 10 ** 18 * 3 / 100);
    }
    require (amount > 0, 'Wrong level');
    ERC20MintBurnInterface(CLNYAddress).burn(msg.sender, amount, reason);
  }

  function getLastCheckout(uint256 tokenId) public view returns (uint256) {
    return tokenData[tokenId].lastCLNYCheckout;
  }

  function getEarned(uint256 tokenId) public view returns (uint256) {
    return getEarningSpeed(tokenId)
      * (block.timestamp - getLastCheckout(tokenId)) * 10 ** 18 / (24 * 60 * 60)
      + tokenData[tokenId].fixedEarnings;
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
    require (NFTMintableInterface(MCAddress).ownerOf(tokenId) != address(0)); // reverts itself
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
      require (msg.sender == NFTMintableInterface(MCAddress).ownerOf(tokenIds[i]));
      uint256 earned = getEarned(tokenIds[i]);
      tokenData[tokenIds[i]].fixedEarnings = 0;
      tokenData[tokenIds[i]].lastCLNYCheckout = uint64(block.timestamp);
      ERC20MintBurnInterface(CLNYAddress).mint(msg.sender, earned);
      ERC20MintBurnInterface(CLNYAddress).mint(treasury, earned * 31 / 49);
      ERC20MintBurnInterface(CLNYAddress).mint(liquidity, earned * 20 / 49);
    }
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

  function purchaseCryochamber() external {
    ICryochamber(cryochamberAddress).purchaseCryochamber(msg.sender);

    uint256 cryochamberPrice = ICryochamber(cryochamberAddress).cryochamberPrice();
    ERC20MintBurnInterface(CLNYAddress).burn(msg.sender, cryochamberPrice, REASON_PURCHASE_CRYOCHAMBER);

  }

  function purchaseCryochamberEnergy(uint256 amount) external {
    ICryochamber(cryochamberAddress).purchaseCryochamberEnergy(msg.sender, amount);

    uint256 energyPrice = ICryochamber(cryochamberAddress).energyPrice();
    ERC20MintBurnInterface(CLNYAddress).burn(msg.sender, energyPrice * amount, REASON_PURCHASE_CRYOCHAMBER_ENERGY);

  }
}
