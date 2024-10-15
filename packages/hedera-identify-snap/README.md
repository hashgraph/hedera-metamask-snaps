# Hedera Identify Snap for MetaMask

This repository contains code for Identify Snap that offers various features such as configuring hedera account, getting current did method, getting DID, resolving DID, getting Verifiable Credentials, creating Verifiable Credentials out of some arbitary JSON object, generating Verifiable Presentations from Verifiable Credentials and verifying VCs and verifying VPs.
Refer to the [Identify Snap Wiki](https://docs.tuum.tech/identify/) for more info on how the snap works and how to
integrate it into your own application.

MetaMask Snaps is a system that allows anyone to safely expand the capabilities of MetaMask. A _snap_ is a program that we run in an isolated environment that can customize the wallet experience.

**_DISCLAIMER_**
_This snap is developed by Tuum Tech while the code for the snap is managed by Swirlds Labs. Furthermore, this wallet is
neither created nor sponsored by Hedera and is built specifically for Metamask_

## Getting Started

### Setup the development environment

```shell
yarn install && yarn start
```

### Connect to official npm package @hashgraph/hedera-identify-snap

If you want to connect the example website to the official npm package [Hedera Identify Snap Npm Package](https://www.npmjs.com/package/@hashgraph/hedera-identify-snap), you'll need to pass this in your environment file ``SNAP_ORIGIN=`npm:@hashgraph/hedera-identify-snap`;``

## Contributing

### Testing and Linting

Run `yarn test` to run the tests once.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and fix any automatically fixable issues.
