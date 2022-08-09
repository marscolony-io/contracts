// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/utils/Strings.sol";
import './interfaces/IGears.sol';


contract Gears is ERC721Enumerable, IGears, Ownable {
  using Strings for uint256;

  struct Gear {
    Rarity rarity;
    GearType gearType;
    uint256 durability;
  }

  Gear[] public initialCommonGears;
  Gear[] public initialRareGears;
  Gear[] public initialLegendaryGears;
  Gear[] public transportGears;

  string private nftBaseURI;
  address public gameManager;
  mapping (uint256 => bool) public locks;
  mapping (uint256 => Gear) public gears;
  mapping (address => uint256) private lastTokenMinted;
  uint256 lastTokenId;
  bool lock;


  modifier onlyGameManager {
    require(msg.sender == gameManager, 'only game manager');
    _;
  }

  constructor (string memory _nftBaseURI) ERC721('Gears', 'Gear') {
    nftBaseURI = _nftBaseURI;
    initialCommonGears.push(Gear(Rarity.COMMON, GearType.Rocket_fuel, 100));
    initialCommonGears.push(Gear(Rarity.COMMON, GearType.Titanium_drill, 100));
    initialCommonGears.push(Gear(Rarity.COMMON, GearType.Small_area_scanner, 100));
    initialCommonGears.push(Gear(Rarity.COMMON, GearType.Ultrasonic_transmitter, 100));

    initialRareGears.push(Gear(Rarity.RARE, GearType.Engine_Furious, 150));
    initialRareGears.push(Gear(Rarity.RARE, GearType.Diamond_drill, 150));
    initialRareGears.push(Gear(Rarity.RARE, GearType.Medium_area_scanner, 150));
    initialRareGears.push(Gear(Rarity.RARE, GearType.Infrared_transmitter, 150));
    
    initialLegendaryGears.push(Gear(Rarity.LEGENDARY, GearType.WD_40, 200));
    initialLegendaryGears.push(Gear(Rarity.LEGENDARY, GearType.Laser_drill, 200));
    initialLegendaryGears.push(Gear(Rarity.LEGENDARY, GearType.Large_area_scanner, 200));
    initialLegendaryGears.push(Gear(Rarity.LEGENDARY, GearType.Vibration_transmitter, 200));

    transportGears.push(Gear(Rarity.LEGENDARY, GearType.The_Nebuchadnezzar, 350));
    transportGears.push(Gear(Rarity.LEGENDARY, GearType.Unknown, 350));

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

  function getRarityUriPath(Rarity _rarity) private pure returns (string memory) {
    if (_rarity == Rarity.COMMON) return "/0/";
    if (_rarity == Rarity.RARE) return "/1/";
    if (_rarity == Rarity.LEGENDARY) return "/2/";
    revert("Invalid rarity");
  }

  function getGearTypeUriPath(GearType _gearType) private pure returns (string memory) {
    if (_gearType == GearType.Rocket_fuel) return "/0/";
    if (_gearType == GearType.Engine_Furious) return "/1/";
    if (_gearType == GearType.WD_40) return "/2/";
    if (_gearType == GearType.Titanium_drill) return "/3/";
    if (_gearType == GearType.Diamond_drill) return "/4/";
    if (_gearType == GearType.Laser_drill) return "/5/";
    if (_gearType == GearType.Small_area_scanner) return "/6/";
    if (_gearType == GearType.Medium_area_scanner) return "/7/";
    if (_gearType == GearType.Large_area_scanner) return "/8/";
    if (_gearType == GearType.Ultrasonic_transmitter) return "/9/";
    if (_gearType == GearType.Infrared_transmitter) return "/10/";
    if (_gearType == GearType.Vibration_transmitter) return "/11/";
    if (_gearType == GearType.The_Nebuchadnezzar) return "/12/";
    if (_gearType == GearType.Unknown) return "/13/";
    revert("Invalid gear type");
  }

  function getLockedUriPath(bool _locked) private pure returns (string memory) {
    if (_locked) return "/0/";
    return "/1/";
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

    string memory baseURI = _baseURI();
    // Rarity rarity = gears[tokenId].rarity;
    GearType gearType = gears[tokenId].gearType;
    bool locked = locks[tokenId];
    return bytes(baseURI).length > 0 ? string(abi.encodePacked(
      baseURI, 
      tokenId.toString(), 
      // getRarityUriPath(rarity),
      getGearTypeUriPath(gearType),
      getLockedUriPath(locked)
      )) : "";
  }

  function lastOwnedTokenURI() public view returns (string memory) {
    require (lastTokenMinted[msg.sender] != 0, "User hasn't minted any token");
    return tokenURI(lastTokenMinted[msg.sender]);
  }

  function randomNumber(uint modulo) public view returns (uint) {
    return (uint(blockhash(block.number - 1)) + block.timestamp) % modulo;
  }

  function getRandomizedGearRarity(Rarity _lootBoxRarity) public view returns (Rarity gearRarity) {

    if (_lootBoxRarity == Rarity.COMMON) {
      if (randomNumber(10) < 1) {
        return Rarity.RARE;
      }
      return Rarity.COMMON;
    }

    if (_lootBoxRarity == Rarity.RARE) {
      if (randomNumber(100) > 85) {
        return Rarity.COMMON;
      }

      if (randomNumber(100) > 70) {
        return Rarity.LEGENDARY;
      }
      
      return Rarity.RARE;
    }

    if (_lootBoxRarity == Rarity.LEGENDARY) {
      if (randomNumber(10) < 1) {
        return Rarity.RARE;
      }
      return Rarity.LEGENDARY;
    }
  }

  function getInitialLength() public view returns (uint) {
    return initialCommonGears.length;
  }

  function getRandomizedGear(Rarity _lootboxRarity, Rarity _gearRarity) public view returns (Gear memory gear) {
    if (_lootboxRarity == Rarity.RARE && _gearRarity == Rarity.LEGENDARY) {
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

  function calculateGear(Rarity _lootBoxRarity) public view returns (Gear memory) {
    Rarity gearRarity = getRandomizedGearRarity(_lootBoxRarity);
    Gear memory gear = getRandomizedGear(_lootBoxRarity, gearRarity);
    return gear;
  }

  function mint(address receiver, Rarity _lootBoxRarity) external override onlyGameManager {
    require(!lock, 'locked');
    lock = true;
    lastTokenId++;
    gears[lastTokenId] = calculateGear(_lootBoxRarity);
    lastTokenMinted[receiver] = lastTokenId;
    _safeMint(receiver, lastTokenId); 
    lock = false;
  }

  function burn(uint256 tokenId) external onlyGameManager {
    _burn(tokenId);
  }


  function allMyTokensPaginate(uint256 _from, uint256 _to) external view returns(uint256[] memory, uint256[] memory, uint256[] memory) {
    uint256 tokenCount = balanceOf(msg.sender);
    if (tokenCount <= _from || _from > _to || tokenCount == 0) {
      return (new uint256[](0), new uint256[](0), new uint256[](0));
    }
    uint256 to = (tokenCount - 1 > _to) ? _to : tokenCount - 1;
    uint256[] memory result = new uint256[](to - _from + 1);
    uint256[] memory resultRarities = new uint256[](to - _from + 1);
    uint256[] memory resultGearTypes = new uint256[](to - _from + 1);
    for (uint256 i = _from; i <= to; i++) {
      result[i - _from] = tokenOfOwnerByIndex(msg.sender, i);
      resultRarities[i - _from] = uint256(gears[result[i - _from]].rarity);
      resultGearTypes[i - _from] = uint256(gears[result[i - _from]].gearType);
    }
    return (result, resultRarities, resultGearTypes);
  }

  function withdrawToken(address _tokenContract, address _whereTo, uint256 _amount) external onlyOwner {
    IERC20 tokenContract = IERC20(_tokenContract);
    tokenContract.transfer(_whereTo, _amount);
  }

  function lockGear(uint256 tokenId) external onlyOwner {
    locks[tokenId] = true;
  }

  function unlockGear(uint256 tokenId) external onlyOwner {
    locks[tokenId] = false;
  }

  function decreaseDurability(uint256 tokenId, uint256 amount) external onlyGameManager {
    gears[tokenId].durability -= amount;
    // burn here if durability became 0?
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override
    {
        super._beforeTokenTransfer(from, to, tokenId);

        require(!locks[tokenId], "This gear is locked by owner and can not be transferred.");
    }
}
