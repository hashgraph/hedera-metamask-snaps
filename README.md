# hedera-metamask-snaps

[MetaMask Snaps](https://support.metamask.io/hc/en-us/articles/18377120661019-Getting-started-with-MetaMask-Snaps) are 3rd party npm packages that users can install directly in their Metamask wallet to extend the functionality of MetaMask.

This repo will host a combination of separate Metamask Snaps to benefit the Hedera community.
Each directory inside the `./packages` directory will be an independent snap.

## Release

The repo has Github Actions automation to generate release artifacts based on the latest changes in a `release/x.y` branch.

This repo follows a git feature branch flow off of main.
All features should see a feature branch created and a PR taking the changes from the feature branch and applying it to main or the appropriate relese branch.

Periodically, release branches e.g. `release/0.1` will be created. From this branch sub packages are able to release versioned npm packages or images.
Code owners of individual snaps are responsible for maintaining the desired versioning of their snaps in readiness for the next repo release.
At the time of release bump of the main repo the current version of updated snaps may be taken and npm publishing of new versions of multiple snaps carried out.

### Publishing Snap Packages

The repo has Github Actions automation to generate new snap package releases adhoc. This is done by updating the `pacakge.json` file in the snap-package:
`./packages/<snap-package-name>/packages/snap/package.json`. The version number should be updated in this file and a commit pushed to the `main` branch.

Once the commit has been pushed to `main` for the snap package version update, the Github workflow `Publish Snap Release` can be manually triggered.
This will build the snap package and publish it to the npm registry.

The `Publish Snap Release` workflow can be triggered by going to the `Actions` tab in the Github repo and selecting the `Publish Snap Release` workflow. 
From here you can select the `Run workflow` button to trigger the workflow. 

The inputs to this workflow are:

- publish-wallet-snap: a boolean flag (default false) to indicate if the wallet snap should be published
- publish-identify-snap: a boolean flag (default false) to indicate if the identify snap should be published
- dry-run-enabled: a boolean flag (default false) to indicate if the publish step should run in dry-run mode

As additional snaps are added to the repo, the workflow can be updated to include additional inputs for publishing these snaps.

- Add a new input to the `Publish Snap Release` workflow in the `.github/workflows/publish-snap-release.yml` file.
- Update the `Generate Matrix` step to include the new snap package in the matrix of snaps to publish.

Note: Currently all hedera-metamask-snaps snap packages are configured with yarn. If a snap is introduced that is configured with
npm or pnpm the `Publish Snap Release` workflow will need to be updated to support this.

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
