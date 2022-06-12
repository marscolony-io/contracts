# Description
[MarsColony](https://marscolony.io) – a Game-Fi Colonisation Framework

# Main actors, actions, flows
- Users can initially mint ERC721 NFT tokens representing land plots (initial count is 21000 and we don't plan to increase it)
- Users can claim ERC20 CLNY tokens from NFT land plots
- Users can build enhancements on NFT land plots
- Users get different count of CLNY per time from land plots (see [tokenomics](https://people.marscolony.io/t/colony-tokenomic/53))
- Users can change name of their NFTs, but it isn't actually used currently
- `DAO` is the owner of all contracts - actually can be EOA or a contract (multisig for example)
- DAO can transfer itself to another address, pause/unpause the whole system
- DAO can airdrop tokens
- `treasury` and `liquidity` – addresses, see [tokenomics](https://people.marscolony.io/t/colony-tokenomic/53)
- DAO can set treasury and liquidity
- DAO can change the minting price of NFT
- DAO can increase maximum token id to increase maximum number of tokens, but can't decrease
- DAO can withdraw ETH (or Harmony or whatever depending on blockchain), but only to DAO address
- DAO can change base uri of the metadata of NFTs
- DAO can set GameManager address in NFT and CLNY tokens to reorganise the system

# Technical details
- All contracts are upgradeable to deliver some planned features as we develop them and possibly integrate other contracts/tokens to the system
- There are some deprecated view functions due to several front-end optimisations. Some of them will be deleted/moved to external contracts as we update frontend to all users
- We are migrating game process from just building enhancements to building them at [x, y], so there are some deprecated functions.
- GameManager is the main game logic contract and holds CLNY earnings until users claim them
- CLNY can be minted/burned only by GameManager
- NFT can be minted only by GameManager
- All parts of the project except frontend are open-sourced (these contracts, helper contracts, metadata server, telegram and discord bot)

# Deployment process
1) CLNY is deployed
2) Land Plot NFT is deployed with valid metadata server URI
3) GameManager is deployed with CLNY, MC, treasury and liquidity addresses
4) Owner sets GameManager both for CLNY and NFT

# Contracts - Harmony mainnet
- GameManager: `0x0D112a449D23961d03E906572D8ce861C441D6c3`
- NFT: `0x0bC0cdFDd36fc411C83221A348230Da5D3DfA89e`
- CLNY: `0x0D625029E21540aBdfAFa3BFC6FD44fB4e0A66d0`
