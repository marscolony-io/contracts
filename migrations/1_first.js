const MarsColony = artifacts.require('MarsColony');

module.exports = function(deployer) {
  deployer.deploy(MarsColony, '0x7c1CEF21C3c46331b7352B08cd90e30cacAee750');
};
