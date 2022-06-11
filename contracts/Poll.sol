// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/IPoll.sol';
import './interfaces/IGameManager.sol';
import './GameConnection.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';

contract Poll is IPoll, Ownable, GameConnection {
  mapping (uint256 => bool) public tokenVoted;

  bool public started = false;
  uint256 public voteCount = 0;

  string public caption;
  string public description;
  string[] public items;

  mapping (uint256 => uint256) private votedFor;
  mapping (uint256 => uint256) public override totalVotesFor;

  struct VotePair {
    string option;
    uint256 voteCount;
  }

  event Vote (address indexed voter, uint256 decision);

  constructor (address _DAO, string memory _caption, string memory _description, string[] memory _items) {
    description = _description;
    caption = _caption;
    items = _items;
    GameConnection.__GameConnection_init(_DAO);
  }

  function getResults() external view returns (VotePair[] memory) {
    VotePair[] memory result = new VotePair[](items.length);
    for (uint256 i = 0; i < items.length; i++) {
      result[i].option = items[i];
      result[i].voteCount = totalVotesFor[i];
    }
    return result;
  }

  function getMC() private view returns (address) {
    return IGameManager(GameManager).MCAddress();
  }

  function getVoteTopic() external view override returns (string memory, string memory, string[] memory) {
    return (description, caption, items);
  }

  function canVote(address _address) external view override returns (bool) {
    if (!started) {
      return false;
    }
    IERC721Enumerable MC = IERC721Enumerable(getMC());
    uint256 tokenCount = MC.balanceOf(_address);
    if (tokenCount == 0) {
      return false;
    }
    for (uint256 i = 0; i < tokenCount; i++) {
      if (!tokenVoted[MC.tokenOfOwnerByIndex(_address, i)]) {
        return true;
      }
    }
    return false;
  }
  
  function vote(address _address, uint256 decision) external override onlyGameManager {
    require (started, 'not started');
    IERC721Enumerable MC = IERC721Enumerable(getMC());
    uint256 tokenCount = MC.balanceOf(_address);
    require (tokenCount > 0, 'you cannot vote');
    for (uint256 i = 0; i < tokenCount; i++) {
      uint256 tokenId = MC.tokenOfOwnerByIndex(_address, i);
      if (!tokenVoted[tokenId]) {
        votedFor[tokenId] = decision;
        totalVotesFor[decision]++;
        voteCount++;
        tokenVoted[tokenId] = true;
      }
    }
    emit Vote(_address, decision);
  }

  function start() external onlyOwner {
    require (!started, 'already started');
    started = true;
  }
}
