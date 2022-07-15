const LandStats = artifacts.require("LandStats");

module.exports = async (callback) => {
  try {
    const ls = await LandStats.at("0x3bB9c59f48F40C9bC37Ec11bE1ad138c8d1C3ECb");

    const stat = await ls.gelClnyStat();
    console.log({ stat });

    callback();
  } catch (error) {
    console.log(error);
  }
};
