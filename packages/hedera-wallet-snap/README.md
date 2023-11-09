# @hashgraph/hedera-wallet-snap

This repository contains code for Hedera Wallet Snap and an example website that integrates the snap to offer various features such as sending HBAR to another HBAR account id and EVM address, retrieving account info from either the Hedera Ledger node or Hedera Mirror node. Refer to the [Hedera Wallet Snap Wiki](https://docs.tuum.tech/hedera-wallet-snap/) for more info on how the snap works and how to integrate it into your own application.

MetaMask Snaps is a system that allows anyone to safely expand the capabilities of MetaMask. A snap is a program that we run in an isolated environment that can customize the wallet experience.

## Getting Started

### Setup the development environment

```shell
yarn install && yarn start
```

### Connect to official npm package @hashgraph/hedera-wallet-snap

If you want to connect the example website to the official npm package [Hedera Wallet Snap Npm Package](https://www.npmjs.com/package/@hashgraph/hedera-wallet-snap), you'll need to pass this in your environment file ``SNAP_ORIGIN=`npm:@hashgraph/hedera-wallet-snap`;``

## Contributing

### Testing and Linting

Run `yarn test` to run the tests once.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and fix any automatically fixable issues.
