// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/Uniswap/IUniswapV2Pair.sol";

contract OraclePolygon is Ownable, IOracle {
    address[] public relayers;
    bool paused;

    IUniswapV2Pair public matic_usdc = IUniswapV2Pair(0xcd353F79d9FADe311fC3119B841e1f456b54e858);
    IUniswapV2Pair public matic_pclny = IUniswapV2Pair(0x9f5c84C6EDd13d60653bFf9450723AB577a23Ba2);

    uint256 constant validityPeriod = 6 * 60 * 60; // six hours in seconds

    modifier onlyRelayer() {
        require(isRelayerAlreadyAdded(msg.sender), "not relayer");
        _;
    }

    modifier onlyRelayerOrOwner() {
        require(isRelayerAlreadyAdded(msg.sender) || owner() == _msgSender(), "neither relayer nor owner");
        _;
    }

    function isRelayerAlreadyAdded(address _relayer) private view returns (bool) {
        for (uint256 i = 0; i < relayers.length; i++) {
            if (relayers[i] == _relayer) {
                return true;
            }
        }
        return false;
    }

    function addRelayer(address _relayer) external onlyOwner {
        require(!isRelayerAlreadyAdded(_relayer), "relayer added already");
        for (uint256 i = 0; i < relayers.length; i++) {
            if (relayers[i] == address(0)) {
                relayers[i] = _relayer;
                return;
            }
        }
        relayers.push(_relayer);
    }

    function deleteRelayer(address _relayer) external onlyOwner {
        require(isRelayerAlreadyAdded(_relayer), "this address is not in relayers");
        for (uint256 i = 0; i < relayers.length; i++) {
            if (relayers[i] == _relayer) {
                delete relayers[i];
            }
        }
    }

    function clnyInUsd() external view returns (bool valid, uint256 rate) {
        (uint256 maticusd, uint256 usdmatic,) = matic_usdc.getReserves();
        (uint256 maticclny, uint256 clnymatic,) = matic_pclny.getReserves();
        return (!paused, 1e6 * maticusd * clnymatic / (maticclny * usdmatic));
    }

    function stop() external onlyRelayerOrOwner {
        paused = true;
    }

    function resume() external onlyRelayerOrOwner {
        paused = false;
    }
}
