// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/IPoll.sol';
import './GameConnection.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

contract Poll is IPoll, Ownable, GameConnection {
  using EnumerableSet for EnumerableSet.AddressSet;

  EnumerableSet.AddressSet private voters;

  bool public started = false;
  uint256 public voteCount = 0;

  string public caption;
  string public description;
  string[] public items;

  mapping (address => uint8) private votedFor;
  mapping (uint8 => uint256) public override totalVotesFor;

  constructor (address _DAO, string memory _caption, string memory _description, string[] memory _items) {
    description = _description;
    caption = _caption;
    items = _items;
    GameConnection.__GameConnection_init(_DAO);
  }

  function usersVote(address _address) public view returns (bool, uint8) {
    if (voters.contains(_address)) {
      return (true, votedFor[_address]);
    } else {
      return (false, 0);
    }
  }

  function myVote() external view returns (bool, uint8) {
    return usersVote(msg.sender);
  }

  function getVoteTopic() external view override returns (string memory, string memory, string[] memory) {
    return (description, caption, items);
  }

  event Vote (address indexed voter, uint8 decision);

  function canVote(address _address) external view override returns (bool) {
    return voters.contains(_address);
  }
  
  function vote(address _address, uint8 decision) external override onlyGameManager {
    require (started, 'not started');
    require (decision != 255, 'wrong decision'); // as we add 1 to decision in votedFor
    require (votedFor[_address] == 0, 'already voted');
    require (voters.contains(_address), 'you cannot vote');
    voters.remove(_address);
    votedFor[_address] = decision;
    totalVotesFor[decision]++;
    voteCount++;
    emit Vote(_address, decision);
  }

  function start() external onlyOwner {
    require (!started, 'already started');
    started = true;
  }

  function voterCount() view external returns (uint256) {
    return voters.length();
  }

  function getVoters() view external returns (address[] memory) {
    return voters.values();
  }

  // yes, I know about Merkle Proof :)
  function addVoters(address[] calldata _voters) external onlyOwner {
    // require (!started, 'Voting already started'); // maybe uncomment for production
    require (_voters.length > 0, 'empty array');
    for (uint256 i = 0; i < _voters.length; i++) {
      voters.add(_voters[i]);
    }
  }
}
