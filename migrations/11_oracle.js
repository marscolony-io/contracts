const ORACLE = artifacts.require("Oracle");

module.exports = async (deployer, network) => {
  await deployer.deploy(ORACLE);
};
