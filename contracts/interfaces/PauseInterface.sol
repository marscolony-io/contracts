// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


interface PauseInterface {
  function pause() external;
  function unpause() external;
}
