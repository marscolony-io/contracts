// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./AbstractRoyalties.sol";
import "../RoyaltiesV2.sol";

contract RoyaltiesV2Impl is AbstractRoyalties, RoyaltiesV2 {

    function getRaribleV2Royalties(uint256 __) override external view returns (LibPart.Part[] memory) {
        __;
        return royalty;
    }

    function _onRoyaltiesSet(LibPart.Part[] memory _royalties) override internal {
        emit RoyaltiesSet(0, _royalties);
    }
}
