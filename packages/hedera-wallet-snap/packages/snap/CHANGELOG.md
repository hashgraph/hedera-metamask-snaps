# Changelog

## [0.1.4](https://github.com/tuum-tech/hedera-pulse/compare/v0.1.4...v0.1.4) (2024-01-17)

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

## [0.1.3](https://github.com/tuum-tech/hedera-pulse/compare/v0.1.3...v0.1.3) (2024-01-05)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

### :bug: Bug Fixes

- Fixed an issue whereby sometimes, hbars couldn't be sent on mainnet due to a network issue

## [0.1.2](https://github.com/tuum-tech/hedera-pulse/compare/v0.1.2...v0.1.2) (2023-12-01)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- No longer showing snap dialog box when importing the account initially. Instead, just throwing an error

### :bug: Bug Fixes

- None

## [0.1.1](https://github.com/tuum-tech/hedera-pulse/compare/v0.1.1...v0.1.1) (2023-11-30)

### :page_with_curl: Documentation

- Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

### :rocket: Features

- No change. Re-released the npm package because of previous npm publish errors

### :bug: Bug Fixes

- None

## [0.1.0](https://github.com/tuum-tech/hedera-pulse/compare/v0.1.0...v0.1.0) (2023-12-28)

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
