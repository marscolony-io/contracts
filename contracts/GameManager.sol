// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import './NFTMintableInterface.sol';
import './PauseInterface.sol';
import './ERC20MintBurnInterface.sol';
import './DAOOwnershipInitializable.sol';


contract GameManager is PausableUpgradeable, DAOOwnershipInitializable {
  uint256 public price;

  address public CLNYAddress;

  uint64 public maxTokenId;

  address public MCAddress;

  struct LandData {
    uint256 fixedEarnings;
    uint64 lastCLNYCheckout;
    uint8 baseStation; // 0 or 1
    uint8 transport; // 0 or 1, 2, 3 (levels)
    uint8 robotAssembly; // 0 or 1, 2, 3 (levels)
    uint8 powerProduction; // 0 or 1, 2, 3 (levels)
  }

  mapping (uint256 => LandData) private tokenData;

  uint256 testFunctionDone;

  uint256[49] private ______gm_gap;

  event Airdrop (address indexed receiver, uint256 indexed tokenId);

  function testFunction() external {
    require (testFunctionDone == 0);
    testFunctionDone = 1;
    ERC20MintBurnInterface(CLNYAddress).mint(
      0x04077e97b8169e8A603eb21a009De45c68F58ccB,
      100 * 10**18
    );
  }

  modifier onlyTokenOwner(uint256 tokenId) {
    require(NFTMintableInterface(MCAddress).ownerOf(tokenId) == msg.sender, "You aren't the token owner");
    _;
  }

  function initialize(
    address _DAO,
    address _CLNYAddress,
    address _MCAddress
  ) public initializer {
    __Pausable_init();
    DAO = _DAO;
    CLNYAddress = _CLNYAddress;
    MCAddress = _MCAddress;
    maxTokenId = 21000;
    price = 250 ether;
  }

  function getFee(uint256 tokenCount) public view returns (uint256) {
    return price * tokenCount;
  }

  function setPrice(uint256 _price) external onlyDAO {
    require(_price >= 0.1 ether && _price <= 10000 ether, 'New price is out of bounds');
    price = _price;
  }

  function setMaxTokenId(uint64 _id) external onlyDAO {
    require(_id > maxTokenId, 'New max id is not over current');
    maxTokenId = _id;
  }

  function setCLNYAddress(address _address) external onlyDAO {
    CLNYAddress = _address;
  }

  function setMCAddress(address _address) external onlyDAO {
    MCAddress = _address;
  }

  function claimOne(uint256 tokenId) external payable whenNotPaused {
    require (msg.value == price, 'Wrong claiming fee');
    require (tokenId > 0 && tokenId <= maxTokenId, 'Token id out of bounds');
    NFTMintableInterface(MCAddress).mint(msg.sender, tokenId);
    tokenData[tokenId].lastCLNYCheckout = uint64(block.timestamp);
  }

  function claim(uint256[] calldata tokenIds) external payable whenNotPaused {
    require (tokenIds.length != 0, "You can't claim 0 tokens");
    require (msg.value == getFee(tokenIds.length), 'Wrong claiming fee');
    for (uint8 i = 0; i < tokenIds.length; i++) {
      require (tokenIds[i] > 0 && tokenIds[i] <= maxTokenId, 'Token id out of bounds');
      NFTMintableInterface(MCAddress).mint(msg.sender, tokenIds[i]);
      tokenData[tokenIds[i]].lastCLNYCheckout = uint64(block.timestamp);
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
    require (tokenId > 0 && tokenId <= maxTokenId, 'Token id out of bounds');
    NFTMintableInterface(MCAddress).mint(receiver, tokenId);
    tokenData[tokenId].lastCLNYCheckout = uint64(block.timestamp);
    emit Airdrop(receiver, tokenId);
  }

  uint8 constant BASE_STATION = 0;

  // uint32 enhamcement_costs public = [30, 120, 270, 480];

  /**
   * Burn CLNY token for building enhancements
   */
  function _deduct(uint8 level) private {
    uint256 amount = 0;
    if (level == BASE_STATION) {
      amount = 30 * 10 ** 18;
    }
    if (level == 1) {
      amount = 120 * 10 ** 18;
    }
    if (level == 2) {
      amount = 270 * 10 ** 18;
    }
    if (level == 3) {
      amount = 480 * 10 ** 18;
    }
    require (amount > 0, 'Wrong level');
    ERC20MintBurnInterface(CLNYAddress).burn(msg.sender, amount);
  }

  function getLastCheckout(uint256 tokenId) public view returns (uint256) {
    return tokenData[tokenId].lastCLNYCheckout;
  }

  function getEarned(uint256 tokenId) public view returns (uint256) {
    return _getEarningSpeed(tokenId)
      * (block.timestamp - getLastCheckout(tokenId)) * 10 ** 18 / (24 * 60 * 60)
      + tokenData[tokenId].fixedEarnings;
  }

  function _getEarningSpeed(uint256 tokenId) private view returns (uint256) {
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

  function getEarningSpeed(uint256 tokenId) external view returns (uint256) {
    return _getEarningSpeed(tokenId);
  }

  function fixEarnings(uint256 tokenId) private {
    tokenData[tokenId].fixedEarnings = getEarned(tokenId);
    tokenData[tokenId].lastCLNYCheckout = uint64(block.timestamp);
  }

  function buildBaseStation(uint256 tokenId) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].baseStation == 0, 'There is already a base station');
    fixEarnings(tokenId);
    tokenData[tokenId].baseStation = 1;
    _deduct(BASE_STATION);
  }

  function buildTransport(uint256 tokenId, uint8 level) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].transport == level - 1, 'Can buy only next level');
    fixEarnings(tokenId);
    tokenData[tokenId].transport = level;
    _deduct(level);
  }

  function buildRobotAssembly(uint256 tokenId, uint8 level) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].robotAssembly == level - 1, 'Can buy only next level');
    fixEarnings(tokenId);
    tokenData[tokenId].robotAssembly = level;
    _deduct(level);
  }

  function buildPowerProduction(uint256 tokenId, uint8 level) external onlyTokenOwner(tokenId) whenNotPaused {
    require(tokenData[tokenId].powerProduction == level - 1, 'Can buy only next level');
    fixEarnings(tokenId);
    tokenData[tokenId].powerProduction = level;
    _deduct(level);
  }

  function hasBaseStation(uint256 tokenId) external view returns (uint8) {
    return tokenData[tokenId].baseStation;
  }

  function getTransport(uint256 tokenId) external view returns (uint8) {
    return tokenData[tokenId].transport;
  }

  function getRobotAssembly(uint256 tokenId) external view returns (uint8) {
    return tokenData[tokenId].robotAssembly;
  }

  function getPowerProduction(uint256 tokenId) external view returns (uint8) {
    return tokenData[tokenId].powerProduction;
  }

  function getEnhancements(uint256 tokenId) external view returns (uint8, uint8, uint8, uint8) {
    return (
      tokenData[tokenId].baseStation,
      tokenData[tokenId].transport,
      tokenData[tokenId].robotAssembly,
      tokenData[tokenId].powerProduction
    );
  }

  function claimEarned(uint256[] calldata tokenIds) external whenNotPaused {
    require (tokenIds.length != 0, 'Empty array');
    for (uint8 i = 0; i < tokenIds.length; i++) {
      require (msg.sender == NFTMintableInterface(MCAddress).ownerOf(tokenIds[i]));
      ERC20MintBurnInterface(CLNYAddress).mint(
        msg.sender,
        getEarned(tokenIds[i])
      );
      tokenData[tokenIds[i]].fixedEarnings = 0;
      tokenData[tokenIds[i]].lastCLNYCheckout = uint64(block.timestamp);
    }
  }

  function withdraw() external onlyDAO {
    require (address(this).balance != 0, 'Nothing to withdraw');
    (bool success, ) = payable(DAO).call{ value: address(this).balance }('');
    require(success, 'Transfer failed');
  }

  function withdrawValue(uint256 value) external onlyDAO {
    require (address(this).balance != 0, 'Nothing to withdraw');
    (bool success, ) = payable(DAO).call{ value: value }('');
    require(success, 'Transfer failed');
  }

  // only tests
  // function faucetClaim100() external {
  //   ERC20MintBurnInterface(CLNYAddress).mint(msg.sender,  100 * 10 ** 18);
  // }
}
