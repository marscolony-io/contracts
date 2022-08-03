// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../LibPart.sol";

abstract contract AbstractRoyalties {
    LibPart.Part[] internal royalty;

    function _saveRoyalties(LibPart.Part[] memory _royalties) internal {
        uint256 totalValue;
        for (uint i = 0; i < _royalties.length; i++) {
            require(_royalties[i].account != address(0x0), "Recipient should be present");
            require(_royalties[i].value != 0, "Royalty value should be positive");
            totalValue += _royalties[i].value;
            royalty.push(_royalties[i]);
        }
        require(totalValue < 10000, "Royalty total value should be < 10000");
        _onRoyaltiesSet(_royalties);
    }

    function _updateAccount(address _from, address _to) internal {
        uint length = royalty.length;
        for(uint i = 0; i < length; i++) {
            if (royalty[i].account == _from) {
                royalty[i].account = payable(address(uint160(_to)));
            }
        }
    }

    function _onRoyaltiesSet(LibPart.Part[] memory _royalties) virtual internal;
}
