// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import './ICLNY.sol';
import './ICollectionManager.sol';
import './ICryochamber.sol';
import './IGameManager.sol';
import './IGears.sol';
import './ILootboxes.sol';
import './IMartianColonists.sol';
import './IMC.sol';
import './IMissionManager.sol';
import './IOracle.sol';
import './ISalesManager.sol';

interface IDependencies {
  struct AddressData {
    address treasury;
    address liquidity;
    ICLNY clny;
    ICollectionManager collectionManager;
    ICryochamber cryochamber;
    IGameManager gameManager;
    IGears gears;
    ILootboxes lootboxes;
    IMartianColonists martianColonists;
    IMC mc;
    IMissionManager missionManager;
    IOracle oracle;
    ISalesManager salesManager;
    address backendSigner;
    bool sharesEconomy;
  }

  function owner() external view returns (address);

  function treasury() external view returns (address);

  function liquidity() external view returns (address);

  function clny() external view returns (ICLNY);

  function collectionManager() external view returns (ICollectionManager);

  function cryochamber() external view returns (ICryochamber);

  function gameManager() external view returns (IGameManager);

  function gears() external view returns (IGears);

  function lootboxes() external view returns (ILootboxes);

  function martianColonists() external view returns (IMartianColonists);

  function mc() external view returns (IMC);

  function missionManager() external view returns (IMissionManager);

  function oracle() external view returns (IOracle);

  function salesManager() external view returns (ISalesManager);

  function backendSigner() external view returns (address);

  function sharesEconomy() external view returns (bool);

  function getTreasuryLiquidityClnyMc()
    external
    view
    returns (
      address,
      address,
      ICLNY,
      IMC
    );

  function getCryochamberClny() external view returns (ICryochamber, ICLNY);

  function getCollectionManagerClny()
    external
    view
    returns (ICollectionManager, ICLNY);

  function getCollectionManagerClnyMc()
    external
    view
    returns (
      ICollectionManager,
      ICLNY,
      IMC
    );

  function getCmMclLbClny()
    external
    view
    returns (
      ICollectionManager,
      IMartianColonists,
      ILootboxes,
      ICLNY
    );

  function getCmMclClny()
    external
    view
    returns (
      ICollectionManager,
      IMartianColonists,
      ICLNY
    );
}
