// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import '../interfaces/IEnums.sol';

library MissionLibrary {
  function stringToUint(string memory s) private pure returns (uint256) {
    bytes memory b = bytes(s);
    uint256 result = 0;
    for (uint256 i = 0; i < b.length; i++) {
      if (uint8(b[i]) >= 48 && uint8(b[i]) <= 57) {
        result = result * 10 + (uint8(b[i]) - 48);
      }
    }
    return result;
  }

  function _getSignerAddress(
    string memory message,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) private pure returns (address signer) {
    string memory header = '\x19Ethereum Signed Message:\n000000';
    uint256 lengthOffset;
    uint256 length;
    assembly {
      length := mload(message)
      lengthOffset := add(header, 57)
    }

    require(length <= 999999);

    uint256 lengthLength = 0;
    uint256 divisor = 100000;

    while (divisor != 0) {
      uint256 digit = length / divisor;
      if (digit == 0) {
        if (lengthLength == 0) {
          divisor /= 10;
          continue;
        }
      }

      lengthLength++;
      length -= digit * divisor;
      divisor /= 10;
      digit += 0x30;
      lengthOffset++;

      assembly {
        mstore8(lengthOffset, digit)
      }
    }

    if (lengthLength == 0) {
      lengthLength = 1 + 0x19 + 1;
    } else {
      lengthLength += 1 + 0x19;
    }

    assembly {
      mstore(header, lengthLength)
    }

    bytes32 check = keccak256(abi.encodePacked(header, message));

    return ecrecover(check, v, r, s);
  }

  function checkSigner(
    string memory message,
    uint8 v,
    bytes32 r,
    bytes32 s,
    address signerAddress
  ) external pure {
    address realAddress = _getSignerAddress(message, v, r, s);
    require(realAddress == signerAddress, 'Signature is not from server');
  }

  function _substring(
    string memory str,
    uint256 startIndex,
    uint256 endIndex
  ) private pure returns (uint256) {
    bytes memory strBytes = bytes(str);
    bytes memory result = new bytes(endIndex - startIndex);
    for (uint256 i = startIndex; i < endIndex; i++) {
      result[i - startIndex] = strBytes[i];
    }
    return stringToUint(string(result));
  }

  function getAssetsFromFinishMissionMessage(string calldata message)
    external
    pure
    returns (
      uint256,
      uint256,
      uint256,
      uint256,
      uint256,
      uint256
    )
  {
    // 0..<32 - random
    // 32..<37 - avatar id
    // 37..<42 - land id
    // 42..<47 - avatar id (again)
    // 47..<55 - xp reward like 00000020
    // 55..<57 - lootbox
    // 57..<61 - avatar mission rewards in CLNY * 100 / decimals (e.g. 100 = 1 CLNY)
    // 61..<65 - avatar mission rewards in CLNY * 100 / decimals (e.g. 100 = 1 CLNY)
    // 65... and several 8-byte blocks - reserved
    uint256 _avatar = _substring(message, 32, 37);
    uint256 _avatar2 = _substring(message, 37, 42);
    uint256 _land = _substring(message, 42, 47);
    uint256 _xp = _substring(message, 47, 55);
    uint256 _lootbox = _substring(message, 55, 57);
    uint256 _avatarReward = _substring(message, 57, 61);
    uint256 _landReward = _substring(message, 61, 65);
    require(_avatar == _avatar2, 'check failed');

    require(_avatar > 0, 'AvatarId is not valid');
    require(_land > 0 && _land <= 21000, 'LandId is not valid');
    require(_xp >= 230 && _xp < 19971800, 'XP increment is not valid');
    require(
      (_lootbox >= 0 && _lootbox <= 3) || (_lootbox >= 23 && _lootbox <= 25),
      'Lootbox code is not valid'
    );

    return (_avatar, _land, _xp, _lootbox, _avatarReward, _landReward);
  }

  function getLootboxRarity(uint256 _lootbox)
    external
    pure
    returns (IEnums.Rarity rarity)
  {
    if (_lootbox == 1 || _lootbox == 23) return IEnums.Rarity.COMMON;
    if (_lootbox == 2 || _lootbox == 24) return IEnums.Rarity.RARE;
    if (_lootbox == 3 || _lootbox == 25) return IEnums.Rarity.LEGENDARY;
  }
}
