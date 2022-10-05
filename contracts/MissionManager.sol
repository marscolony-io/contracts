// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./GameConnection.sol";
import "./interfaces/IDependencies.sol";
import "./interfaces/IOwnable.sol";
import "./interfaces/IGameManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MissionManager is GameConnection, PausableUpgradeable {
    address reserved0;
    address reserved1;
    address reserved2;

    modifier onlyOwner() {
        require(msg.sender == d.owner(), "Only owner");
        _;
    }

    modifier onlyGameManager() {
        require(msg.sender == address(d.gameManager()), "Only game manager");
        _;
    }

    struct AccountMissionState {
        bool isAccountPrivate; // don't allow missions on my lands
        uint8 revshare;
    }

    mapping(address => AccountMissionState) public accountMissionState;

    struct LandData {
        uint256 availableMissionCount;
        address owner;
        bool isPrivate;
        uint8 revshare;
        uint8 transportHubLevel;
    }

    IDependencies public d;

    uint256[49] private ______gap;

    function initialize(IDependencies _d) external initializer {
        PausableUpgradeable.__Pausable_init();
        d = _d;
    }

    function setDependencies(IDependencies addr) external {
        require(address(d) == address(0) || d.owner() == msg.sender);
        d = addr;
    }

    function setAccountPrivacy(bool _isPrivate) external {
        accountMissionState[msg.sender].isAccountPrivate = _isPrivate;
    }

    function setAccountRevshare(uint8 _revshare) external {
        require(_revshare >= 1, "Revshare value is too low, 1 is min");
        require(_revshare <= 99, "Revshare value is too high, 99 is max");
        accountMissionState[msg.sender].revshare = _revshare;
    }

    function _calculateLandMissionsLimits(uint256 landId)
        private
        view
        returns (uint256 availableMissionCount)
    {
        uint256[] memory landIds = new uint256[](1);
        landIds[0] = landId;
        IGameManager gameManager = d.gameManager();
        IGameManager.AttributeData memory landAttributes = gameManager
            .getAttributesMany(landIds)[0];

        if (landAttributes.baseStation == 0) {
            return 0;
        }

        return 1 + landAttributes.powerProduction;
    }

    function getRevshare(address _address)
        public
        view
        returns (uint8 revShare)
    {
        revShare = accountMissionState[_address].revshare;
        if (revShare == 0) {
            revShare = 20;
        }
        return revShare;
    }

    function getRevshareForLands(uint256[] memory tokenIds)
        external
        view
        returns (uint8[] memory)
    {
        uint8[] memory result = new uint8[](tokenIds.length);
        IMC mc = d.mc();
        for (uint256 i = 0; i < tokenIds.length; i++) {
            result[i] = getRevshare(IOwnable(address(mc)).ownerOf(tokenIds[i]));
        }
        return result;
    }

    function _getLandData(uint256 landId)
        private
        view
        returns (LandData memory)
    {
        IMC mc = d.mc();
        address landOwner = IOwnable(address(mc)).ownerOf(landId);
        bool isPrivate = accountMissionState[landOwner].isAccountPrivate;
        uint256 availableMissionCount = _calculateLandMissionsLimits(landId);
        uint8 revshare = getRevshare(IOwnable(address(mc)).ownerOf(landId));
        uint256[] memory lands = new uint256[](1);
        lands[0] = landId;

        uint8 transportHubLevel = d
        .gameManager()
        .getAttributesMany(lands)[0].transport;

        return
            LandData(
                availableMissionCount,
                landOwner,
                isPrivate,
                revshare,
                transportHubLevel
            );
    }

    function getLandsData(uint256[] memory landId)
        external
        view
        returns (LandData[] memory)
    {
        if (landId.length == 0) {
            return new LandData[](0);
        } else {
            LandData[] memory result = new LandData[](landId.length);
            for (uint256 i = 0; i < landId.length; i++) {
                result[i] = _getLandData(landId[i]);
            }
            return result;
        }
    }

    function pause() external onlyGameManager {
        _pause();
    }

    function unpause() external onlyGameManager {
        _unpause();
    }

    function withdrawToken(
        address _tokenContract,
        address _whereTo,
        uint256 _amount
    ) external onlyOwner {
        IERC20 tokenContract = IERC20(_tokenContract);
        tokenContract.transfer(_whereTo, _amount);
    }
}
