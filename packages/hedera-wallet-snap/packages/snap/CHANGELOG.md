# Changelog

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
