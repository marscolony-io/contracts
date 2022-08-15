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

  address public DAO; // owner

  struct Gear {
    Rarity rarity;
    uint256 gearType;
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

  modifier onlyDAO {
    require(msg.sender == DAO, 'Only DAO');
    _;
  }

  // Rocket_fuel  0
  // Engine_Furious  1
  // WD_40  2
  // Titanium_drill  3
  // Diamond_drill  4
  // Laser_drill  5
  // Small_area_scanner 6
  // Medium_area_scanner  7
  // Large_area_scanner  8
  // Ultrasonic_transmitter  9
  // Infrared_transmitter  10
  // Vibration_transmitter  11
  // The_Nebuchadnezzar  12
  // Unknown 13

  constructor (string memory _nftBaseURI) ERC721('Gears', 'Gear') {
    DAO = msg.sender;
    nftBaseURI = _nftBaseURI;
    initialCommonGears.push(Gear(Rarity.COMMON, 0, 100, false));
    initialCommonGears.push(Gear(Rarity.COMMON, 1, 100, false));
    initialCommonGears.push(Gear(Rarity.COMMON, 2, 100, false));
    initialCommonGears.push(Gear(Rarity.COMMON, 3, 100, false));

    initialRareGears.push(Gear(Rarity.RARE, 4, 150, false));
    initialRareGears.push(Gear(Rarity.RARE, 5, 150, false));
    initialRareGears.push(Gear(Rarity.RARE, 6, 150, false));
    initialRareGears.push(Gear(Rarity.RARE, 7, 150, false));
    
    initialLegendaryGears.push(Gear(Rarity.LEGENDARY, 8, 200, false));
    initialLegendaryGears.push(Gear(Rarity.LEGENDARY, 9, 200, false));
    initialLegendaryGears.push(Gear(Rarity.LEGENDARY, 10, 200, false));
    initialLegendaryGears.push(Gear(Rarity.LEGENDARY, 11, 200, false));

    transportGears.push(Gear(Rarity.LEGENDARY, 12, 350, false));
    transportGears.push(Gear(Rarity.LEGENDARY, 13, 350, false));

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


  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

    string memory baseURI = _baseURI();
    uint256 gearType = gears[tokenId].gearType;
    return bytes(baseURI).length > 0 ? string(abi.encodePacked(
      baseURI, 
      tokenId.toString(), 
      "/",
      gearType.toString()
      )) : "";
  }

  function lastOwnedTokenURI() public view returns (string memory) {
    require (lastTokenMinted[msg.sender] != 0, "User hasn't minted any token");
    return tokenURI(lastTokenMinted[msg.sender]);
  }

  function randomNumber(uint modulo) public view returns (uint) {
    return (uint(blockhash(block.number - 1)) + block.timestamp) % modulo;
  }

  function getRandomizedGearRarity(ILootboxes.Rarity _lootBoxRarity) public view returns (Rarity gearRarity) {

    if (_lootBoxRarity == ILootboxes.Rarity.COMMON) {
      if (randomNumber(10) < 1) {
        return Rarity.RARE;
      }
      return Rarity.COMMON;
    }

    if (_lootBoxRarity == ILootboxes.Rarity.RARE) {
      if (randomNumber(100) > 85) {
        return Rarity.COMMON;
      }

      if (randomNumber(100) > 70) {
        return Rarity.LEGENDARY;
      }
      
      return Rarity.RARE;
    }

    if (_lootBoxRarity == ILootboxes.Rarity.LEGENDARY) {
      if (randomNumber(10) < 1) {
        return Rarity.RARE;
      }
      return Rarity.LEGENDARY;
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
      // concatenate legendary and transports arrays
      uint256 concatenatedArrayLength = initialLegendaryGears.length + transportGears.length;
      Gear[] memory legendariesAndTransports = new Gear[](concatenatedArrayLength);
      uint256 index;
      for (uint256 i = 0; i < initialLegendaryGears.length; i++) {
        legendariesAndTransports[index] = initialLegendaryGears[i];
        index++;
      }

      for (uint256 i = 0; i < transportGears.length; i++) {
        legendariesAndTransports[index] = transportGears[i];
        index++;
      }

      uint256 modulo = randomNumber(legendariesAndTransports.length);
      return legendariesAndTransports[modulo];
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

  function airdrop(address receiver, Rarity rarity, uint64 gearType, uint64 durability) external onlyDAO {
    gears[nextIdToMint] = Gear(rarity, gearType, durability, false);
    _safeMint(receiver, nextIdToMint);
    nextIdToMint++;
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

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyOwner {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
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

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override
    {
        super._beforeTokenTransfer(from, to, tokenId);

        require(!gears[tokenId].locked, "This gear is locked by owner and can not be transferred");
    }
}
