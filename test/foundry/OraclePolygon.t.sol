// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./interface.sol";
import "../../contracts/OraclePolygon.sol";

contract OraclePolytonTest is DSTest {
    OraclePolygon public oracle;
    CheatCodes cheats = CheatCodes(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);

    function setUp() public {
        // test on this certain block
        cheats.createSelectFork("polygon", 34286000);
        oracle = new OraclePolygon();
        oracle.addRelayer(address(1));
    }

    function testClnyInUsd() public {
        (bool valid, uint256 clnyInUsd) = oracle.clnyInUsd();
        console.log("clny in usd", valid, clnyInUsd);
        assertTrue(valid);
        // this clny price was on block 34286000
        assertEq(clnyInUsd, 214990149199138911849);
    }

    function testStop() public {
        cheats.startPrank(address(1));
        oracle.stop();
        (bool valid,) = oracle.clnyInUsd();
        assertTrue(!valid);
        cheats.stopPrank();
    }

    function testResume() public {
        cheats.startPrank(address(1));
        oracle.resume();
        (bool valid,) = oracle.clnyInUsd();
        assertTrue(valid);
        cheats.stopPrank();
    }
}
