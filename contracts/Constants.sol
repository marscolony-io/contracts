// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

abstract contract Constants {
    // CLNY mint and burn reasons
    uint256 constant REASON_UPGRADE = 1;
    uint256 constant REASON_PLACE = 2;
    uint256 constant REASON_RENAME_AVATAR = 3;
    uint256 constant REASON_MINT_AVATAR = 4;
    uint256 constant REASON_CREATORS_ROYALTY = 5;
    uint256 constant REASON_EARNING = 6;
    uint256 constant REASON_TREASURY = 7;
    uint256 constant REASON_LP_POOL = 8;
    uint256 constant REASON_MISSION_REWARD = 9;
    uint256 constant REASON_PURCHASE_CRYOCHAMBER = 10;
    uint256 constant REASON_PURCHASE_CRYOCHAMBER_ENERGY = 11;
    uint256 constant REASON_OPEN_LOOTBOX = 12;
    uint256 constant REASON_ARTIST_ROYALTY = 13;

    uint256 constant REASON_SHARES_PREPARE_CLNY = 100;

    // gears
    uint256 constant ROCKET_FUEL = 0;
    uint256 constant ENGINE_FURIOUS = 1;
    uint256 constant WD_40 = 2;
    uint256 constant TITANIUM_DRILL = 3;
    uint256 constant DIAMOND_DRILL = 4;
    uint256 constant LASER_DRILL = 5;
    uint256 constant SMALL_AREA_SCANNER = 6;
    uint256 constant MEDIUM_AREA_SCANNER = 7;
    uint256 constant LARGE_AREA_SCANNER = 8;
    uint256 constant ULTRASONIC_TRANSMITTER = 9;
    uint256 constant INFRARED_TRANSMITTER = 10;
    uint256 constant VIBRATION_TRANSMITTER = 11;
    uint256 constant THE_NEBUCHADNEZZAR = 12;
    uint256 constant THE_WRAITH = 13;

    uint256 constant CATEGORY_ENGINE = 0;
    uint256 constant CATEGORY_DRILL = 1;
    uint256 constant CATEGORY_SCANNER = 2;
    uint256 constant CATEGORY_TRANSMITTER = 3;
    uint256 constant CATEGORY_TRANSPORT = 4;

    uint256 constant COMMON_GEAR_DURABILITY = 100;
    uint256 constant RARE_GEAR_DURABILITY = 150;
    uint256 constant LEGENDARY_GEAR_DURABILITY = 200;
    uint256 constant TRANSPORT_GEAR_DURABILITY = 350;

    uint256 constant COMMON_OPENING_PRICE_USD = 200; // cents
    uint256 constant RARE_OPENING_PRICE_USD = 400;
    uint256 constant LEGENDARY_OPENING_PRICE_USD = 800;

    // wallets
    address constant ARTIST1_ROYALTY_WALLET =
        0x352c478CD91BA54615Cc1eDFbA4A3E7EC9f60EE1;
    address constant ARTIST2_ROYALTY_WALLET =
        0x6cDa418Ea9a6be44531a567f778D340615017D00;
}
