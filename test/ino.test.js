const { assert, expect } = require('chai');
const { time, BN, expectRevert } = require('openzeppelin-test-helpers');

const McIno = artifacts.require('McIno');

contract('INO NFT test', (accounts) => {
  const [owner, user] = accounts;

  let ino;

  before(async () => {
    ino = await McIno.deployed();
  });

  it('Mint', async () => {
    await expectRevert(ino.mint(user, 10, { from: user }), 'Ownable: caller is not the owner');
    await ino.mint(user, 10, { from: owner });
    await ino.mint(user, 10, { from: owner });
    await ino.mint(user, 1, { from: owner });
    const totalSupply = await ino.totalSupply();
    expect(+totalSupply).to.be.equal(21);
    const uri = await ino.tokenURI(2);
    expect(uri).to.be.equal('https://marscolony.io/ino.json');
  });
});
