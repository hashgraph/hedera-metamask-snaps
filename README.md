# hedera-metamask-snaps

[MetaMask Snaps](https://support.metamask.io/hc/en-us/articles/18377120661019-Getting-started-with-MetaMask-Snaps) are 3rd party npm packages that users can install directly in their Metamask wallet to extend the functionality of MetaMask.

This repo will host a combination of separate Metamask Snaps to benefit the Hedera community.
Each directory inside the `./packages` directory will be an independent snap.

## Release

The repo has Github Actions automation to generate release artififacts based on the latest changes in a `release/x.y` branch.

This repo follows a git feature branch flow off of main.
All features should see a feature branch created and a PR taking the changes from the feature branch and applying it to main or the appropriate relese branch.

Periodically, release branches e.g. `release/0.1` will be created. From this branch sub packages are able to release versioned npm packages or images.
Code owners of individual snaps are responsible for maintaining the desired versioning of their snaps in readiness for the next repo release.
At the time of release bump of the main repo the current version of updated snaps may be taken and npm publishing of new versions of multiple snaps carried out.

## Support

If you have a question on how to use the product, please see our
[support guide](https://github.com/hashgraph/.github/blob/main/SUPPORT.md).

## Contributing

Contributions are welcome. Please see the
[contributing guide](https://github.com/hashgraph/.github/blob/main/CONTRIBUTING.md)
to see how you can get involved.

## Code of Conduct

This project is governed by the
[Contributor Covenant Code of Conduct](https://github.com/hashgraph/.github/blob/main/CODE_OF_CONDUCT.md). By
participating, you are expected to uphold this code of conduct. Please report unacceptable behavior
to [oss@hedera.com](mailto:oss@hedera.com).

## License

[Apache License 2.0](LICENSE)

# 🔐 Security

Please do not file a public ticket mentioning the vulnerability. Refer to the security policy defined in the [SECURITY.md](https://github.com/hashgraph/hedera-sourcify/blob/main/SECURITY.md).
