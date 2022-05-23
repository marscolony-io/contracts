// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import "./interfaces/ISalesManager.sol";
import "./interfaces/IMC.sol";

contract SalesManager is ReentrancyGuardUpgradeable, OwnableUpgradeable, PausableUpgradeable, ISalesManager {

  address public MC;

  uint256[50] private ______gap_0;

  uint256 constant ROYALTY_MULTIPLIER = 100;

  function initialize (address _MC) public initializer {
    __Pausable_init();
    __Ownable_init();
    __ReentrancyGuard_init();
    MC = _MC;
  }

  struct TokenData {
    address owner;
    uint price;
    uint time;
  }

  mapping (uint256 => TokenData) public sales;
  address public royaltyWallet;
  uint256 public royalty;

  function placeToken (uint price, uint _days, uint256 tokenId) public {
    require(IERC721(MC).ownerOf(tokenId) == msg.sender, "You're not an owner of this token");
    // require(IERC721(MC).getApproved(tokenId) == address(this), "NFT must be approved to market");
    require(price > 0, "Price is too low");
    require(_days <= 30, "Too long period of time");
    require(_days > 0, "Time period too short");
    sales[tokenId] = TokenData(msg.sender, price, block.timestamp+_days*24*60*60);
  }

  function removeToken (uint256 tokenId) public {
    require(IERC721(MC).ownerOf(tokenId) == msg.sender, "You're not an owner of this token");
    delete sales[tokenId];
  }

  function removeTokenAfterTransfer (uint256 tokenId) external override {
    require(MC == msg.sender, "You're not an nft contract");
    delete sales[tokenId];
  }

  function buyToken(uint256 tokenId) public payable nonReentrant {
    require(msg.value >= sales[tokenId].price, "Not enough funds");
    require(sales[tokenId].time != 0, "Token is not for sale");
    require(sales[tokenId].time > block.timestamp, "Token time period ended");
    // require(IERC721(MC).getApproved(tokenId) == address(this), "NFT must be approved to market");
    uint256 royaltyPrice = sales[tokenId].price*royalty/(ROYALTY_MULTIPLIER*100);
    payable(sales[tokenId].owner).transfer(sales[tokenId].price-royaltyPrice);
    if (royalty > 0) {
      payable(royaltyWallet).transfer(royaltyPrice);
    }
    if (msg.value-sales[tokenId].price>0) {
      payable(msg.sender).transfer(msg.value-sales[tokenId].price);
    }
    // IERC721(MC).safeTransferFrom(sales[tokenId].owner, msg.sender, tokenId, "");
    IMC(MC).trade(sales[tokenId].owner, msg.sender, tokenId);
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

  function setRoyalty(uint256 _royalty) external onlyOwner {
    require(_royalty <= 20*ROYALTY_MULTIPLIER, "Royalty must be less or equal 20%");
    royalty = _royalty;
  }
}
