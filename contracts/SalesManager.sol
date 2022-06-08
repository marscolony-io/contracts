// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import "./interfaces/ISalesManager.sol";
import "./interfaces/IMC.sol";
import "./GameConnection.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract SalesManager is ReentrancyGuardUpgradeable, OwnableUpgradeable, PausableUpgradeable, ISalesManager, GameConnection {

  address public MC;

  uint256[50] private ______gap_0;

  uint256 constant ROYALTY_MULTIPLIER = 100;

  function initialize (address _DAO, address _MC) public initializer {
    __Pausable_init();
    __Ownable_init();
    __ReentrancyGuard_init();
    GameConnection.__GameConnection_init(_DAO);
    MC = _MC;
  }

  struct TokenData {
    address owner;
    uint price;
    uint time;
    bool receivesClny;
  }

  mapping (uint256 => TokenData) public sales;
  address public royaltyWallet;
  uint256 public royalty;
  uint256 public clnyRoyalty;
  address private constant _CLNY = 0x0D625029E21540aBdfAFa3BFC6FD44fB4e0A66d0;
  address private constant MarsColonyRouter = 0x8F8312cAf7091523879Ac59De3A2560Ef291312d;
  IERC20 constant WONE = IERC20(0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a);
  IERC20 constant CLNY = IERC20(_CLNY);
  IERC20 constant SLP_CLNY = IERC20(0xcd818813F038A4d1a27c84d24d74bBC21551FA83);

  function placeToken (uint price, uint _days, uint256 tokenId, bool receivesClny) public {
    require(IERC721(MC).ownerOf(tokenId) == msg.sender, "You're not an owner of this token");
    // require(IERC721(MC).getApproved(tokenId) == address(this), "NFT must be approved to market");
    require(price > 0, "Price is too low");
    require(_days <= 30, "Too long period of time");
    require(_days > 0, "Time period too short");
    sales[tokenId] = TokenData(msg.sender, price, block.timestamp + _days * 24 * 60 * 60, receivesClny);
  }

  function removeToken (uint256 tokenId) public {
    require(IERC721(MC).ownerOf(tokenId) == msg.sender, "You're not an owner of this token");
    delete sales[tokenId];
  }

  function removeTokenAfterTransfer (uint256 tokenId) external override {
    require(MC == msg.sender, "You're not an nft contract");
    delete sales[tokenId];
  }

  function buyToken(uint256 tokenId, address buyer) external override payable nonReentrant onlyGameManager {
    require(msg.value >= sales[tokenId].price, "Not enough funds");
    require(sales[tokenId].time != 0, "Token is not for sale");
    require(sales[tokenId].time > block.timestamp, "Token time period ended");
    if (sales[tokenId].receivesClny) {
      uint256 royaltyPrice = sales[tokenId].price * clnyRoyalty / (ROYALTY_MULTIPLIER * 100);
      uint256 woneInLiq = WONE.balanceOf(address(SLP_CLNY));
      uint256 clnyInLiq = CLNY.balanceOf(address(SLP_CLNY));
      uint256 value = (sales[tokenId].price - royaltyPrice) * (woneInLiq / clnyInLiq);
      value = value - (value * 3 / 100);
      address[] memory path = new address[](2);
      path[0] = IUniswapV2Router02(MarsColonyRouter).WETH();
      path[1] = _CLNY;
      IUniswapV2Router02(MarsColonyRouter).swapExactETHForTokens{ value: value }(value, path, sales[tokenId].owner, block.timestamp);
      if (clnyRoyalty > 0) {
        payable(royaltyWallet).transfer(royaltyPrice);
      }
      if (msg.value - sales[tokenId].price>0) {
        payable(buyer).transfer(msg.value - sales[tokenId].price);
      }
      IMC(MC).trade(sales[tokenId].owner, buyer, tokenId);
    } else {
      uint256 royaltyPrice = sales[tokenId].price * royalty / (ROYALTY_MULTIPLIER * 100);
      payable(sales[tokenId].owner).transfer(sales[tokenId].price - royaltyPrice);
      if (royalty > 0) {
        payable(royaltyWallet).transfer(royaltyPrice);
      }
      if (msg.value - sales[tokenId].price>0) {
        payable(buyer).transfer(msg.value - sales[tokenId].price);
      }
      IMC(MC).trade(sales[tokenId].owner, buyer, tokenId);
    }
  }

  function isTokenPlaced (uint256 tokenId) view external returns(bool) {
    if (sales[tokenId].owner != address(0) && sales[tokenId].time > block.timestamp) {
      return true;
    } else {
      return false;
    }
  }

  function setMC(address _MC) external onlyOwner {
    MC = _MC;
  }

  function setRoyaltyAddress(address _royaltyWallet) external onlyOwner {
    royaltyWallet = _royaltyWallet;
  }

  function setRoyalty(uint256 _royalty, uint256 _clnyRoyalty) external onlyOwner {
    require(_clnyRoyalty <= 20 * ROYALTY_MULTIPLIER, "Royalty must be less or equal 20%");
    require(_royalty <= 20 * ROYALTY_MULTIPLIER, "Royalty must be less or equal 20%");
    clnyRoyalty = _clnyRoyalty;
    royalty = _royalty;
  }
}
