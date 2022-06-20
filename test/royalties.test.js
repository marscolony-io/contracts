const { assert, expect } = require('chai');
const { time, BN, expectRevert } = require('openzeppelin-test-helpers');

const MC = artifacts.require('MC');

contract('Royalties test', (accounts) => {
  const [owner, user] = accounts;

  let mc;

  before(async () => {
    mc = await MC.deployed();
  });

  it('Get initial royalties', async () => {
    const royaltyLegacyBefore = await mc.getRaribleV2Royalties(100);
    expect(royaltyLegacyBefore).to.be.eql([]);
    const royaltyBefore = await mc.royaltyInfo(100, web3.utils.toWei('500'));
    expect(royaltyBefore.receiver).to.be.equal('0x0000000000000000000000000000000000000000');
    expect(+royaltyBefore.royaltyAmount).to.be.equal(0);
  });

  it('Set royalties', async () => {
    await mc.setRoyalties(accounts[0], 10_00);
  });

  it('Get royalties', async () => {
    const royaltyLegacy = await mc.getRaribleV2Royalties(100);
    expect(royaltyLegacy[0].account).to.be.equal(accounts[0]);
    expect(royaltyLegacy[0].value).to.be.equal('1000');
    const royalty = await mc.royaltyInfo(100, web3.utils.toWei('500'));
    expect(royalty.receiver).to.be.equal(accounts[0]);
    expect(+royalty.royaltyAmount).to.be.equal(50e18);
  });
});
