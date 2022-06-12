// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IPoll {
  function getVoteTopic() external view returns (string memory, string memory, string[] memory);
  function totalVotesFor(uint8 __) external view returns (uint256);
  function vote(address _address, uint8 decision) external;
  function canVote(address _address) external view returns (bool);
}
