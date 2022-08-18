// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/utils/Strings.sol";
import './interfaces/IGears.sol';
import './interfaces/ILootboxes.sol';
import './interfaces/IEnums.sol';


contract Gears is ERC721Enumerable, IGears, Ownable {
  using Strings for uint256;

  Gear[] public initialCommonGears;
  Gear[] public initialRareGears;
  Gear[] public initialLegendaryGears;
  Gear[] public transportGears;
  Gear[] public additionalGears; 

  string private nftBaseURI;
  address public collectionManager;
  mapping (uint256 => Gear) gears;
  mapping (address => uint256) private lastTokenMinted;
  uint256 public nextIdToMint = 1;
  bool lock;


  modifier onlyCollectionManager {
    require(msg.sender == collectionManager, 'only collection manager');
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
    initialCommonGears.push(Gear(IEnums.Rarity.COMMON, ROCKET_FUEL, CATEGORY_ENGINE, 100, false));
    initialCommonGears.push(Gear(IEnums.Rarity.COMMON, TITANIUM_DRILL, CATEGORY_DRILL, 100, false));
    initialCommonGears.push(Gear(IEnums.Rarity.COMMON, SMALL_AREA_SCANNER, CATEGORY_SCANNER, 100, false));
    initialCommonGears.push(Gear(IEnums.Rarity.COMMON, ULTRASONIC_TRANSMITTER, CATEGORY_TRANSMITTER, 100, false));

    initialRareGears.push(Gear(IEnums.Rarity.RARE, ENGINE_FURIOUS, CATEGORY_ENGINE, 150, false));
    initialRareGears.push(Gear(IEnums.Rarity.RARE, DIAMOND_DRILL, CATEGORY_DRILL, 150, false));
    initialRareGears.push(Gear(IEnums.Rarity.RARE, MEDIUM_AREA_SCANNER, CATEGORY_SCANNER, 150, false));
    initialRareGears.push(Gear(IEnums.Rarity.RARE, INFRARED_TRANSMITTER, CATEGORY_TRANSMITTER, 150, false));
    
    initialLegendaryGears.push(Gear(IEnums.Rarity.LEGENDARY, WD_40, CATEGORY_ENGINE, 200, false));
    initialLegendaryGears.push(Gear(IEnums.Rarity.LEGENDARY, LASER_DRILL, CATEGORY_DRILL, 200, false));
    initialLegendaryGears.push(Gear(IEnums.Rarity.LEGENDARY, LARGE_AREA_SCANNER, CATEGORY_SCANNER, 200, false));
    initialLegendaryGears.push(Gear(IEnums.Rarity.LEGENDARY, VIBRATION_TRANSMITTER, CATEGORY_TRANSMITTER, 200, false));

    transportGears.push(Gear(IEnums.Rarity.LEGENDARY, THE_NEBUCHADNEZZAR, CATEGORY_TRANSPORT, 350, false));
    transportGears.push(Gear(IEnums.Rarity.LEGENDARY, UNKNOWN, CATEGORY_TRANSPORT, 350, false));

  }

  function setCollectionManager(address _collectionManager) external onlyOwner {
    collectionManager = _collectionManager;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return nftBaseURI;
  }

  function setBaseURI(string memory newURI) external override onlyOwner {
    nftBaseURI = newURI;
  }

  function getRarityUrlPath(IEnums.Rarity rarity) private pure returns (string memory) {
    if (rarity == IEnums.Rarity.COMMON) return "0";
    if (rarity == IEnums.Rarity.RARE) return "1";
    return "2";
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

    string memory baseURI = _baseURI();
    uint256 gearType = gears[tokenId].gearType;
    uint256 gearCategory = gears[tokenId].category;
    IEnums.Rarity rarity = gears[tokenId].rarity;
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

  function getRandomizedGearRarity(IEnums.Rarity _lootBoxRarity) private view returns (IEnums.Rarity gearRarity) {

    if (_lootBoxRarity == ILootboxes.IEnums.Rarity.COMMON) {
      if (randomNumber(10) < 1) {
        return IEnums.Rarity.RARE; // 10%
      }
      return IEnums.Rarity.COMMON; // 90%
    }

    if (_lootBoxRarity == ILootboxes.IEnums.Rarity.RARE) {
      if (randomNumber(100) > 85) { 
        return IEnums.Rarity.COMMON; // 15%
      }

      if (randomNumber(100) > 70) {
        return IEnums.Rarity.LEGENDARY; // 15%
      }
      
      return IEnums.Rarity.RARE; // 70%
    }

    if (_lootBoxRarity == ILootboxes.IEnums.Rarity.LEGENDARY) {
      if (randomNumber(10) < 1) {
        return IEnums.Rarity.RARE; // 10%
      }
      return IEnums.Rarity.LEGENDARY; // 90%
    }
  }

  function getRandomizedGear(IEnums.Rarity _lootboxRarity, IEnums.Rarity _gearRarity) public view returns (Gear memory gear) {
    if (_lootboxRarity == ILootboxes.IEnums.Rarity.RARE && _gearRarity == IEnums.Rarity.LEGENDARY) {
      // exclude transports
      uint256 modulo = randomNumber(initialLegendaryGears.length) ;
      return initialLegendaryGears[modulo];
    }

    if (_gearRarity == IEnums.Rarity.COMMON) {
      uint256 modulo = randomNumber(initialCommonGears.length);
      return initialCommonGears[modulo];
    }

    if (_gearRarity == IEnums.Rarity.RARE) {
      uint256 modulo = randomNumber(initialRareGears.length);
      return initialRareGears[modulo];
    }

    if (_gearRarity == IEnums.Rarity.LEGENDARY) {
      // choose from legendary and transports arrays
  
      uint256 modulo = randomNumber(initialLegendaryGears.length + transportGears.length);
      if (modulo < initialLegendaryGears.length) return initialLegendaryGears[modulo];
      return transportGears[modulo - initialLegendaryGears.length];
    }

  }

  function calculateGear(IEnums.Rarity _lootBoxRarity) public view returns (Gear memory) {
    IEnums.Rarity gearRarity = getRandomizedGearRarity(_lootBoxRarity);
    Gear memory gear = getRandomizedGear(_lootBoxRarity, gearRarity);
    return gear;
  }

  function mint(address receiver,IEnums.Rarity _lootBoxRarity) external override onlyCollectionManager {
    require(!lock, 'locked');
    lock = true;
    gears[nextIdToMint] = calculateGear(_lootBoxRarity);
    lastTokenMinted[receiver] = nextIdToMint;
    _safeMint(receiver, nextIdToMint); 
    nextIdToMint++;
    lock = false;
  }

  function airdrop(address receiver, IEnums.Rarity rarity, uint256 gearType, uint256 category, uint256 durability) external onlyOwner {
    require(!lock, 'locked');
    lock = true;
    gears[nextIdToMint] = Gear(rarity, gearType, category, durability, false);
    _safeMint(receiver, nextIdToMint);
    nextIdToMint++;
    lock = false;
  }


  function burn(uint256 tokenId) external onlyCollectionManager {
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

  function decreaseDurability(uint256 tokenId, uint32 amount) external onlyCollectionManager {
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
