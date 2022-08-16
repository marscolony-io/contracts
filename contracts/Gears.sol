// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/utils/Strings.sol";
import './interfaces/IGears.sol';
import './interfaces/ILootboxes.sol';


contract Gears is ERC721Enumerable, IGears, Ownable {
  using Strings for uint256;

  struct Gear {
    Rarity rarity;
    uint256 gearType;
    uint256 category;
    uint256 durability;
    bool locked;
  }

  Gear[] public initialCommonGears;
  Gear[] public initialRareGears;
  Gear[] public initialLegendaryGears;
  Gear[] public transportGears;
  Gear[] public additionalGears; 

  string private nftBaseURI;
  address public gameManager;
  mapping (uint256 => Gear) public gears;
  mapping (address => uint256) private lastTokenMinted;
  uint256 public nextIdToMint = 1;
  bool lock;


  modifier onlyGameManager {
    require(msg.sender == gameManager, 'only game manager');
    _;
  }

  modifier onlyTokenOwner(uint256 tokenId) {
    require(msg.sender == ownerOf(tokenId), 'only token owner');
    _;
  }

  uint256 constant ROCKET_FUEL = 0;
  uint256 constant ENGINE_FURIOUS = 1;
  uint256 constant WD_40 = 2;
  uint256 constant TITANIUM_DRILL = 3;
  uint256 constant DIAMOND_DRILL = 4;
  uint256 constant LASER_DRILL = 5;
  uint256 constant SMALL_AREA_SCANNER = 6;
  uint256 constant MEDIUM_AREA_SCANNER = 7;
  uint256 constant LARGE_AREA_SCANNER = 8;
  uint256 constant ULTRASONIC_TRANSMITTER = 9;
  uint256 constant INFRARED_TRANSMITTER = 10;
  uint256 constant VIBRATION_TRANSMITTER = 11;
  uint256 constant THE_NEBUCHADNEZZAR = 12; 
  uint256 constant UNKNOWN = 13;

  uint256 constant CATEGORY_ENGINE = 0;
  uint256 constant CATEGORY_DRILL = 1;
  uint256 constant CATEGORY_SCANNER = 2;
  uint256 constant CATEGORY_TRANSMITTER = 3;
  uint256 constant CATEGORY_TRANSPORT = 4;

  constructor (string memory _nftBaseURI) ERC721('Gears', 'Gear') {
    nftBaseURI = _nftBaseURI;
    initialCommonGears.push(Gear(Rarity.COMMON, ROCKET_FUEL, CATEGORY_ENGINE, 100, false));
    initialCommonGears.push(Gear(Rarity.COMMON, TITANIUM_DRILL, CATEGORY_DRILL, 100, false));
    initialCommonGears.push(Gear(Rarity.COMMON, SMALL_AREA_SCANNER, CATEGORY_SCANNER, 100, false));
    initialCommonGears.push(Gear(Rarity.COMMON, ULTRASONIC_TRANSMITTER, CATEGORY_TRANSMITTER, 100, false));

    initialRareGears.push(Gear(Rarity.RARE, ENGINE_FURIOUS, CATEGORY_ENGINE, 150, false));
    initialRareGears.push(Gear(Rarity.RARE, DIAMOND_DRILL, CATEGORY_DRILL, 150, false));
    initialRareGears.push(Gear(Rarity.RARE, MEDIUM_AREA_SCANNER, CATEGORY_SCANNER, 150, false));
    initialRareGears.push(Gear(Rarity.RARE, INFRARED_TRANSMITTER, CATEGORY_TRANSMITTER, 150, false));
    
    initialLegendaryGears.push(Gear(Rarity.LEGENDARY, WD_40, CATEGORY_ENGINE, 200, false));
    initialLegendaryGears.push(Gear(Rarity.LEGENDARY, LASER_DRILL, CATEGORY_DRILL, 200, false));
    initialLegendaryGears.push(Gear(Rarity.LEGENDARY, LARGE_AREA_SCANNER, CATEGORY_SCANNER, 200, false));
    initialLegendaryGears.push(Gear(Rarity.LEGENDARY, VIBRATION_TRANSMITTER, CATEGORY_TRANSMITTER, 200, false));

    transportGears.push(Gear(Rarity.LEGENDARY, THE_NEBUCHADNEZZAR, CATEGORY_TRANSPORT, 350, false));
    transportGears.push(Gear(Rarity.LEGENDARY, UNKNOWN, CATEGORY_TRANSPORT, 350, false));

  }

  function setGameManager(address _gameManager) external onlyOwner {
    gameManager = _gameManager;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return nftBaseURI;
  }

  function setBaseURI(string memory newURI) external override onlyOwner {
    nftBaseURI = newURI;
  }

  function getRarityUrlPath(Rarity rarity) private pure returns (string memory) {
    if (rarity == Rarity.COMMON) return "0";
    if (rarity == Rarity.RARE) return "1";
    return "2";
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

    string memory baseURI = _baseURI();
    uint256 gearType = gears[tokenId].gearType;
    uint256 gearCategory = gears[tokenId].category;
    Rarity rarity = gears[tokenId].rarity;
    return bytes(baseURI).length > 0 ? string(abi.encodePacked(
      baseURI, 
      tokenId.toString(), 
      "/",
      gearType.toString(),
      "/",
      gearCategory.toString(),
      "/",
      getRarityUrlPath(rarity)
      )) : "";
  }

  function lastOwnedTokenURI() external view returns (string memory) {
    require (lastTokenMinted[msg.sender] != 0, "User hasn't minted any token");
    return tokenURI(lastTokenMinted[msg.sender]);
  }

  function randomNumber(uint modulo) private view returns (uint) {
    return (uint(blockhash(block.number - 1)) + block.timestamp) % modulo;
  }

  function getRandomizedGearRarity(ILootboxes.Rarity _lootBoxRarity) private view returns (Rarity gearRarity) {

    if (_lootBoxRarity == ILootboxes.Rarity.COMMON) {
      if (randomNumber(10) < 1) {
        return Rarity.RARE; // 10%
      }
      return Rarity.COMMON; // 90%
    }

    if (_lootBoxRarity == ILootboxes.Rarity.RARE) {
      if (randomNumber(100) > 85) { 
        return Rarity.COMMON; // 15%
      }

      if (randomNumber(100) > 70) {
        return Rarity.LEGENDARY; // 70%
      }
      
      return Rarity.RARE; // 15%
    }

    if (_lootBoxRarity == ILootboxes.Rarity.LEGENDARY) {
      if (randomNumber(10) < 1) {
        return Rarity.RARE; // 10%
      }
      return Rarity.LEGENDARY; // 90%
    }
  }

  function getRandomizedGear(ILootboxes.Rarity _lootboxRarity, Rarity _gearRarity) public view returns (Gear memory gear) {
    if (_lootboxRarity == ILootboxes.Rarity.RARE && _gearRarity == Rarity.LEGENDARY) {
      // exclude transports
      uint256 modulo = randomNumber(initialLegendaryGears.length) ;
      return initialLegendaryGears[modulo];
    }

    if (_gearRarity == Rarity.COMMON) {
      uint256 modulo = randomNumber(initialCommonGears.length);
      return initialCommonGears[modulo];
    }

    if (_gearRarity == Rarity.RARE) {
      uint256 modulo = randomNumber(initialRareGears.length);
      return initialRareGears[modulo];
    }

    if (_gearRarity == Rarity.LEGENDARY) {
      // choose from legendary and transports arrays
  
      uint256 modulo = randomNumber(initialLegendaryGears.length + transportGears.length);
      if (modulo < initialLegendaryGears.length) return initialLegendaryGears[modulo];
      return transportGears[modulo - initialLegendaryGears.length];
    }

  }

  function calculateGear(ILootboxes.Rarity _lootBoxRarity) public view returns (Gear memory) {
    Rarity gearRarity = getRandomizedGearRarity(_lootBoxRarity);
    Gear memory gear = getRandomizedGear(_lootBoxRarity, gearRarity);
    return gear;
  }

  function mint(address receiver, ILootboxes.Rarity _lootBoxRarity) external override onlyGameManager {
    require(!lock, 'locked');
    lock = true;
    gears[nextIdToMint] = calculateGear(_lootBoxRarity);
    lastTokenMinted[receiver] = nextIdToMint;
    _safeMint(receiver, nextIdToMint); 
    nextIdToMint++;
    lock = false;
  }

  function airdrop(address receiver, Rarity rarity, uint256 gearType, uint256 category, uint256 durability) external onlyOwner {
    require(!lock, 'locked');
    lock = true;
    gears[nextIdToMint] = Gear(rarity, gearType, category, durability, false);
    _safeMint(receiver, nextIdToMint);
    nextIdToMint++;
    lock = false;
  }


  function burn(uint256 tokenId) external onlyGameManager {
    gears[tokenId].locked = false;
    _burn(tokenId);
  }


  function allMyTokensPaginate(uint256 _from, uint256 _to) external view returns(uint256[] memory, Gear[] memory) {
    uint256 tokenCount = balanceOf(msg.sender);
    if (tokenCount <= _from || _from > _to || tokenCount == 0) {
      return (new uint256[](0), new Gear[](0));
    }
    uint256 to = (tokenCount - 1 > _to) ? _to : tokenCount - 1;
    uint256[] memory result = new uint256[](to - _from + 1);
    Gear[] memory resultGears = new Gear[](to - _from + 1);
    for (uint256 i = _from; i <= to; i++) {
      result[i - _from] = tokenOfOwnerByIndex(msg.sender, i);
      resultGears[i - _from] = gears[result[i - _from]];
    }
    return (result, resultGears);
  }

 
  function lockGear(uint256 tokenId) external onlyTokenOwner(tokenId) {
    gears[tokenId].locked = true;
  }

  function unlockGear(uint256 tokenId) external onlyTokenOwner(tokenId) {
    gears[tokenId].locked = false;
  }

  function decreaseDurability(uint256 tokenId, uint32 amount) external onlyGameManager {
    if (gears[tokenId].durability <= amount) {
       _burn(tokenId);
    }

    gears[tokenId].durability -= amount;
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override {
    super._beforeTokenTransfer(from, to, tokenId);

    require(!gears[tokenId].locked, "This gear is locked by owner and can not be transferred");
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyOwner {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }

}
