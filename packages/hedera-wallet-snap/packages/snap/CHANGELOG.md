# Changelog

## [0.3.1](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.3.1...v0.3.1) (2024-04-15)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- Removed the `header` parameter from `signMessage` API
- Utilized the `copyable` method to display text passed from Dapps as recommended by MetaMask which ignores Markdown and other special characters

### :bug: Bug Fixes

## [0.3.0](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.3.0...v0.3.0) (2024-04-05)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- Upgraded @hashgraph/sdk to >=2.41.0
- [Added new APIs to perform atomic swap between any two accounts. This uses scheduled transaction to send the transaction to the ledger and to complete the swap.)](https://github.com/hashgraph/hedera-metamask-snaps/issues/102)
- [Added a new API to update the properties of an existing token such as name, symbol, treasury account, etc.](https://github.com/hashgraph/hedera-metamask-snaps/issues/91)
- [Added a new API to delete a token](https://github.com/hashgraph/hedera-metamask-snaps/issues/92)
- [Added new APIs to mint/burn fungible and non-fungible tokens](https://github.com/hashgraph/hedera-metamask-snaps/issues/93)
- [Added new APIs grant/revoke KYC to/from any account for a given token provided KYC key was set during its creation](https://github.com/hashgraph/hedera-metamask-snaps/issues/98)
- [Added new APIs pause/unpause provided Pause key was set during token its creation](https://github.com/hashgraph/hedera-metamask-snaps/issues/100)
- [Added new APIs to wipe a token from any accounts provided Wipe key was set during its creation](Added new APIs to wipe a token from any accounts provided Wipe key was set during its creation)
- [Added a new API to show private key for the snap account within Metamask dialog box](https://github.com/hashgraph/hedera-metamask-snaps/issues/264)
- Added a retry mechanism when sending transactions to the network to make it more robust
- Update Github Action workflows to report on JUnit results
- Augment Node/Yarn configuration to produce JUnit test data
- Enable support for CodeCov & Codacy Code Coverage
- Augment Node/Yarn configuration to produce code coverage data
- More optimizations

### :bug: Bug Fixes

## [0.2.5](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.2.5...v0.2.5) (2024-02-26)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- [Added a new API for creating a token(fungible/non-fungible)](https://github.com/hashgraph/hedera-metamask-snaps/issues/94)
- Made several optimizations and improvements to the way APIs are called
- Added some unit and functional tests
- Setup github actions

### :bug: Bug Fixes

- Fixed some import issues

## [0.2.4](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.2.4...v0.2.4) (2024-02-05)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

### :bug: Bug Fixes

- Fixed some import issues

## [0.2.3](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.2.3...v0.2.3) (2024-02-02)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- Added support of external accounts import that are of type `ProtobufEncoded` in addition to `ECDSA` and `ED25519`

### :bug: Bug Fixes

- Fixed a bug whereby snap could not fetch info after testnet reset as account IDs would also be reset with that

## [0.2.1](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.2.1...v0.2.1) (2024-02-01)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- Updated `transferCrypto` API to support the transfer of approved hbar and other tokens after `approveAllowance` is called

### :bug: Bug Fixes

- Fixed a bug whereby `approveAllowance` was not approving the correct amount of tokens

## [0.2.0](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.2.0...v0.2.0) (2024-01-31)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- Added a new API to associate fungible/non-fungible tokens to an account
- Added support to be able to transfer any kind of tokens including hbar, fungible and non-fungible tokens
- [Added a new API to stake/unstake Hbar to and from Hedera Network nodes](https://github.com/hashgraph/hedera-metamask-snaps/issues/54)
- [Added a new API to approve/delete an allowance for Hbar, tokens and NFTs](https://github.com/hashgraph/hedera-metamask-snaps/issues/52)
- [Added a new API to delete a Hedera account from the ledger permanently. This action is irreversible!](https://github.com/hashgraph/hedera-metamask-snaps/issues/53)

### :bug: Bug Fixes

## [0.1.5](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.1.5...v0.1.5) (2024-01-24)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- Added a helper method to check whether the account id is associated with the given private key on hedera ledger

### :bug: Bug Fixes

## [0.1.4](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.1.4...v0.1.4) (2024-01-17)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- [Added a new snap API to let users sign any message using their snap account](https://github.com/hashgraph/hedera-metamask-snaps/issues/31)
- [Added a new snap API to retrieve transactions history from Hedera Mirror node](https://github.com/hashgraph/hedera-metamask-snaps/issues/51)
- Added the UI for `signMessage` API to the example site
- Added the UI for `getTransactions` API to the example site
- Added `endowment:lifecycle-hooks` to the snap permissions list
- Added a snap specific method that will be run on the installation of the snap. This will show the users more info about the snap
- Added a snap specific method that will be run on the update of the snap. This will show all the new features that are part of the new release
- Modified the way errors are handled. Now, we use the metamask provided library - `providerErrors` from `@metamask/rpc-errors`

### :bug: Bug Fixes

- Fixed an issue whereby sometimes, hbars couldn't be sent on mainnet due to a network issue

## [0.1.3](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.1.3...v0.1.3) (2024-01-05)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

### :bug: Bug Fixes

- Fixed an issue whereby sometimes, hbars couldn't be sent on mainnet due to a network issue

## [0.1.2](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.1.2...v0.1.2) (2023-12-01)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- No longer showing snap dialog box when importing the account initially. Instead, just throwing an error

### :bug: Bug Fixes

- None

## [0.1.1](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.1.1...v0.1.1) (2023-11-30)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- No change. Re-released the npm package because of previous npm publish errors

### :bug: Bug Fixes

- None

## [0.1.0](https://github.com/hashgraph/hedera-metamask-snaps/compare/v0.1.0...v0.1.0) (2023-12-28)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- Control Hedera Accounts that deal with both Account Ids and EVM addresses via Metamask wallet
- Retrieve account info from Hedera Ledger Node(this will incur some costs)
- Retrieve account info from a Hedera Mirror Node(the URL of the Mirror node can be passed as part of the API request)
- View HBAR balance
- View tokens balance and other token info
- Send HBAR to another HBAR account associated with an Account Id
- Send HBAR to another HBAR account associated with an EVM address
- Import any Hedera account(both ECDSA and ED25519) using private key and store in Snaps persistent storage inside Snaps execution environment.

### :bug: Bug Fixes

-
