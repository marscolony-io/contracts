/**
 * Empty migration used to deploy instances to upgrade manually
 * ```
 * truffle deploy --network hartest -f 3 --to 3
 * ```
 */

const GM = artifacts.require("GameManager");
const MC = artifacts.require("MC");
const CLNY = artifacts.require("CLNY");
const MartianColonists = artifacts.require("MartianColonists");
const Poll = artifacts.require("Poll");
const fs = require("fs");

module.exports = async (deployer, network, addresses) => {
  if (network === "development") {
    return; // this file for manual migrations; pass in tests
  }
  let gmAddress;
  let landlords;
  if (network === "hartest") {
    const [, , ...accountsExceptFirstTwo] = addresses;
    landlords = fs
      .readFileSync("./landlords-testnet.txt", "utf-8")
      .split("\n")
      .map((lord) => lord.trim())
      .filter((lord) => lord.length > 5);
    landlords = [...landlords, ...accountsExceptFirstTwo]; // for tests
    gmAddress = "0xc65F8BA708814653EDdCe0e9f75827fe309E29aD";
  } else if (network === "harmain") {
    landlords = fs
      .readFileSync("./landlords.txt", "utf-8")
      .split("\n")
      .map((lord) => lord.trim())
      .filter((lord) => lord.length > 5);
    gmAddress = "0x0D112a449D23961d03E906572D8ce861C441D6c3";
  } else {
    console.log("--- WRONG NETWORK ---");
    return;
  }
  await deployer.deploy(
    Poll,
    addresses[0],
    "Vote for your favorite mission rewards proposal!",
    "Be sure to read the proposals at [people.marscolony.io](https://people.marscolony.io/t/official-vote-mission-rewards/4628) before voting",
    [
      "Revenue share, layered economy with future resources",
      "ORE token (Profession-specific rewards)",
      "Combined proposal with strong points from each",
    ]
  );
  const poll = await Poll.deployed();
  const gm = await GM.at(gmAddress);
  await poll.setGameManager(gm.address);

  const BUNCH_SIZE = 600;
  for (let i = 0; i < landlords.length / BUNCH_SIZE; i++) {
    const bunch = [];
    console.log({ i });
    for (let j = i * BUNCH_SIZE; j < (i + 1) * BUNCH_SIZE; j++) {
      if (landlords.length > j) {
        bunch.push(landlords[j]);
      }
    }
    await poll.addVoters(bunch);
    console.log(`${bunch.length} voters added`);
  }
  const size = await poll.voterCount();
  // console.log(+size, landlords.length);
  console.log("starting...");
  await poll.start();
  console.log("linking...", Poll.address);
  await gm.setPollAddress(Poll.address);
  console.log("linked");
};
