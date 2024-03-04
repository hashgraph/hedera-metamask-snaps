import { providerErrors } from '@metamask/rpc-errors';
import { PrivateKey } from '@hashgraph/sdk';

import _ from 'lodash';
import { ethers } from 'ethers';
import { divider, heading, text } from '@metamask/snaps-ui';
import { KeyStore, SnapDialogParams, WalletSnapState } from '../types/state';
import { StateUtils } from '../utils/StateUtils';
import { CryptoUtils } from '../utils/CryptoUtils';
import { SnapUtils } from '../utils/SnapUtils';
import { SnapState } from './SnapState';
import { Utils } from '../utils/Utils';
import { Account, AccountInfo, ExternalAccount } from '../types/account';
import { HederaUtils } from '../utils/HederaUtils';
import { HederaClientImplFactory } from '../client/HederaClientImplFactory';

export class SnapAccounts {
  /**
   * Function that creates an empty IdentitySnapState object in the Identity Snap state for the provided address.
   *
   * @param state - WalletSnapState.
   * @param network - Hedera network.
   * @param evmAddress - The account address.
   */
  public static async initAccountState(
    state: WalletSnapState,
    network: string,
    evmAddress: string,
  ): Promise<void> {
    state.currentAccount = { hederaEvmAddress: evmAddress } as Account;
    if (_.isEmpty(state.accountState[evmAddress])) {
      state.accountState[evmAddress] = {};
    }
    state.accountState[evmAddress][network] = StateUtils.getEmptyAccountState();

    await SnapState.updateState(state);
  }

  /**
   * Check if Hedera account was imported.
   *
   * @param state - WalletSnapState.
   * @param network - Hedera network.
   * @param evmAddress - Ethereum address.
   * @returns Result.
   */
  public static async getHederaAccountIdIfExists(
    state: WalletSnapState,
    network: string,
    evmAddress: string,
  ): Promise<string> {
    let result = '';
    for (const address of Object.keys(state.accountState)) {
      if (state.accountState[address][network]) {
        const { keyStore } = state.accountState[address][network];
        if (keyStore.address === evmAddress) {
          result = keyStore.hederaAccountId;
        }
      }
    }
    return result;
  }

  public static async getCurrentMetamaskAccount(): Promise<string> {
    const accounts = (await ethereum.request({
      method: 'eth_requestAccounts',
    })) as string[];
    return accounts[0];
  }

  /**
   * Function that returns account info of the currently selected MetaMask account.
   *
   * @param origin - Source.
   * @param state - WalletSnapState.
   * @param params - Parameters that were passed by the user.
   * @param network - Hedera network.
   * @param mirrorNodeUrl - Hedera mirror node URL.
   * @param isExternalAccount - Whether this is a metamask or a non-metamask account.
   * @returns Nothing.
   */
  public static async setCurrentAccount(
    origin: string,
    state: WalletSnapState,
    params: unknown,
    network: string,
    mirrorNodeUrl: string,
    isExternalAccount: boolean,
  ): Promise<void> {
    let metamaskEvmAddress = '';
    let externalEvmAddress = '';
    let connectedAddress = '';
    let keyStore = {} as KeyStore;
    // Handle external account(non-metamask account)
    if (isExternalAccount) {
      const nonMetamaskAccount = params as ExternalAccount;
      const { accountIdOrEvmAddress, curve = 'ECDSA_SECP256K1' } =
        nonMetamaskAccount.externalAccount;
      if (ethers.isAddress(accountIdOrEvmAddress)) {
        const { connectedAddress: _connectedAddress, keyStore: _keyStore } =
          await SnapAccounts.connectEVMAccount(
            origin,
            state,
            network,
            mirrorNodeUrl,
            curve,
            Utils.ensure0xPrefix(accountIdOrEvmAddress),
          );
        connectedAddress = _connectedAddress;
        keyStore = _keyStore;
      } else {
        try {
          const { connectedAddress: _connectedAddress, keyStore: _keyStore } =
            await SnapAccounts.connectHederaAccount(
              origin,
              state,
              network,
              mirrorNodeUrl,
              curve,
              (accountIdOrEvmAddress as string).toLowerCase(),
            );
          connectedAddress = _connectedAddress;
          keyStore = _keyStore;
        } catch (error: any) {
          const address = accountIdOrEvmAddress as string;
          console.error(
            `Could not connect to the Hedera account ${address} on ${network}. Please try again: ${String(
              error,
            )}`,
          );
          throw providerErrors.custom({
            code: 4200,
            message: `Could not connect to the Hedera account ${address} on ${network}. Please try again: ${String(
              error,
            )}`,
            data: address,
          });
        }
      }
      externalEvmAddress = connectedAddress.toLowerCase();
    } else {
      // Handle metamask connected account
      connectedAddress = await SnapAccounts.getCurrentMetamaskAccount();
      metamaskEvmAddress = connectedAddress.toLowerCase();

      // Generate a new wallet according to the Hedera Wallet's entrophy combined with the currently connected EVM address
      const res = await CryptoUtils.generateWallet(connectedAddress);
      if (!res) {
        console.log('Failed to generate snap wallet for DID operations');
        throw providerErrors.unsupportedMethod(
          'Failed to generate snap wallet for DID operations',
        );
      }
      keyStore.curve = 'ECDSA_SECP256K1';
      keyStore.privateKey = res.privateKey;
      keyStore.publicKey = res.publicKey;
      keyStore.address = res.address.toLowerCase();
      connectedAddress = res.address.toLowerCase();
      keyStore.hederaAccountId = await SnapAccounts.getHederaAccountIdIfExists(
        state,
        network,
        connectedAddress,
      );
    }

    connectedAddress = connectedAddress.toLowerCase();

    // Initialize if not in snap state
    if (
      !Object.keys(state.accountState).includes(connectedAddress) ||
      (Object.keys(state.accountState).includes(connectedAddress) &&
        !Object.keys(state.accountState[connectedAddress]).includes(network))
    ) {
      console.log(
        `The address ${connectedAddress} has NOT yet been configured for the '${network}' network in the Hedera Wallet. Configuring now...`,
      );
      await SnapAccounts.initAccountState(state, network, connectedAddress);
    }

    await SnapAccounts.importMetaMaskAccount(
      origin,
      state,
      network,
      mirrorNodeUrl,
      connectedAddress,
      metamaskEvmAddress,
      externalEvmAddress,
      keyStore,
    );
  }

  /**
   * Connect EVM Account.
   *
   * @param origin - Source.
   * @param state - Wallet state.
   * @param network - Hedera network.
   * @param mirrorNodeUrl - Hedera mirror node URL.
   * @param curve - Public Key curve('ECDSA_SECP256K1' | 'ED25519').
   * @param evmAddress - EVM Account address.
   */
  public static async connectEVMAccount(
    origin: string,
    state: WalletSnapState,
    network: string,
    mirrorNodeUrl: string,
    curve: 'ECDSA_SECP256K1' | 'ED25519',
    evmAddress: string,
  ): Promise<any> {
    let result = {} as KeyStore;
    let connectedAddress = '';
    for (const addr of Object.keys(state.accountState)) {
      if (state.accountState[addr][network]) {
        const { keyStore } = state.accountState[addr][network];

        if (evmAddress === keyStore.address) {
          if (keyStore.curve !== curve) {
            console.error(
              `You passed '${curve}' as the digital signature algorithm to use but the account was derived using ${keyStore.curve} on '${network}'. Please make sure to pass in the correct value for "curve".`,
            );
            throw providerErrors.custom({
              code: 4200,
              message: `You passed '${curve}' as the digital signature algorithm to use but the account was derived using ${keyStore.curve} on '${network}'. Please make sure to pass in the correct value for "curve".`,
              data: { network, curve, evmAddress },
            });
          }
          connectedAddress = addr;
          result = keyStore;
          break;
        }
      }
    }

    if (_.isEmpty(connectedAddress)) {
      const dialogParamsForPrivateKey: SnapDialogParams = {
        type: 'prompt',
        content: await SnapUtils.generateCommonPanel(origin, [
          heading('Connect to EVM Account'),
          text('Enter private key for the following account'),
          divider(),
          text(`EVM Address: ${evmAddress}`),
        ]),
        placeholder: '2386d1d21644dc65d...',
      };
      const privateKey = (await SnapUtils.snapDialog(
        dialogParamsForPrivateKey,
      )) as string;

      try {
        const accountInfo: AccountInfo = await HederaUtils.getMirrorAccountInfo(
          evmAddress,
          mirrorNodeUrl,
        );

        const publicKey =
          PrivateKey.fromStringECDSA(privateKey).publicKey.toStringRaw();
        if (_.isEmpty(accountInfo)) {
          console.error(
            `This Hedera account is not yet active. Please activate it by sending some HBAR to this account on '${network}'. Address: ${evmAddress} Public Key: ${publicKey}`,
          );
          throw providerErrors.custom({
            code: 4200,
            message: `This Hedera account is not yet active. Please activate it by sending some HBAR to this account on '${network}'. Address: ${evmAddress} Public Key: ${publicKey}`,
            data: { network, curve, address: evmAddress, publicKey },
          });
        }

        if (
          accountInfo.key.type === 'ProtobufEncoded' &&
          curve !== 'ECDSA_SECP256K1'
        ) {
          console.error(
            `You passed '${curve}' as the digital signature algorithm to use but the account was derived using 'ECDSA_SECP256K1' on '${network}'. Please make sure to pass in the correct value for "curve".`,
          );
          throw providerErrors.custom({
            code: 4200,
            message: `You passed '${curve}' as the digital signature algorithm to use but the account was derived using 'ECDSA_SECP256K1' on '${network}'. Please make sure to pass in the correct value for "curve".`,
            data: { network, curve, address: evmAddress, publicKey },
          });
        }

        if (
          accountInfo.key.type !== 'ProtobufEncoded' &&
          accountInfo.key.type !== curve
        ) {
          console.error(
            `You passed '${curve}' as the digital signature algorithm to use but the account was derived using '${
              accountInfo.key.type ?? ''
            }' on '${network}'. Please make sure to pass in the correct value for "curve".`,
          );
          throw providerErrors.custom({
            code: 4200,
            message: `You passed '${curve}' as the digital signature algorithm to use but the account was derived using '${accountInfo.key.type}' on '${network}'. Please make sure to pass in the correct value for "curve".`,
            data: { network, curve, address: evmAddress, publicKey },
          });
        }

        if (
          accountInfo.key.type !== 'ProtobufEncoded' &&
          accountInfo.key.type !== curve
        ) {
          console.error(
            `You passed '${curve}' as the digital signature algorithm to use but the account was derived using '${
              accountInfo.key.type ?? ''
            }' on '${network}'. Please make sure to pass in the correct value for "curve".`,
          );
          throw providerErrors.custom({
            code: 4200,
            message: `You passed '${curve}' as the digital signature algorithm to use but the account was derived using '${
              accountInfo.key.type ?? ''
            }' on '${network}'. Please make sure to pass in the correct value for "curve".`,
            data: { network, curve, address: evmAddress, publicKey },
          });
        }

        const hederaClientFactory = new HederaClientImplFactory(
          accountInfo.accountId,
          network,
          curve,
          privateKey,
        );

        const hederaClient = await hederaClientFactory.createClient();
        if (hederaClient) {
          result.curve = curve;
          result.privateKey = privateKey;
          result.publicKey = publicKey;
          result.address = Utils.ensure0xPrefix(accountInfo.evmAddress);
          result.hederaAccountId = accountInfo.accountId;
          connectedAddress = Utils.ensure0xPrefix(accountInfo.evmAddress);
        } else {
          const dialogParamsForHederaAccountId: SnapDialogParams = {
            type: 'alert',
            content: await SnapUtils.generateCommonPanel(origin, [
              heading('Hedera Account Status'),
              text(
                `The private key you passed is not associated with the Hedera account '${evmAddress}' on '${network}' that uses the elliptic curve '${curve}'`,
              ),
            ]),
          };
          await SnapUtils.snapDialog(dialogParamsForHederaAccountId);

          console.error(
            `The private key you passed is not associated with the Hedera account '${result.address}' on '${network}' that uses the elliptic curve '${curve}'`,
          );
          throw providerErrors.custom({
            code: 4200,
            message: `The private key you passed is not associated with the Hedera account '${result.address}' on '${network}' that uses the elliptic curve '${curve}'`,
            data: { network, curve, address: evmAddress, publicKey },
          });
        }
      } catch (error: any) {
        console.error(
          `Could not setup a Hedera client. Please try again: ${String(error)}`,
        );
        throw providerErrors.unsupportedMethod(
          `Could not setup a Hedera client. Please try again: ${String(error)}`,
        );
      }
    }

    return {
      connectedAddress,
      keyStore: result,
    };
  }

  /**
   * Connect Hedera Account.
   *
   * @param origin - Source.
   * @param state - Wallet state.
   * @param network - Hedera network.
   * @param mirrorNodeUrl - Hedera mirror node URL.
   * @param curve - Public Key curve('ECDSA_SECP256K1' | 'ED25519').
   * @param accountId - Hedera Account id.
   */
  public static async connectHederaAccount(
    origin: string,
    state: WalletSnapState,
    network: string,
    mirrorNodeUrl: string,
    curve: 'ECDSA_SECP256K1' | 'ED25519',
    accountId: string,
  ): Promise<any> {
    let result = {} as KeyStore;
    let connectedAddress = '';
    for (const addr of Object.keys(state.accountState)) {
      if (state.accountState[addr][network]) {
        const { keyStore } = state.accountState[addr][network];
        if (keyStore.hederaAccountId === accountId) {
          if (keyStore.curve !== curve) {
            console.error(
              `You passed '${curve}' as the digital signature algorithm to use but the account was derived using ${keyStore.curve} on '${network}'. Please make sure to pass in the correct value for "curve".`,
            );
            throw providerErrors.custom({
              code: 4200,
              message: `You passed '${curve}' as the digital signature algorithm to use but the account was derived using ${keyStore.curve} on '${network}'. Please make sure to pass in the correct value for "curve".`,
              data: { network, curve, accountId },
            });
          }
          connectedAddress = addr;
          result = keyStore;
          break;
        }
      }
    }

    if (_.isEmpty(connectedAddress)) {
      const dialogParamsForPrivateKey: SnapDialogParams = {
        type: 'prompt',
        content: await SnapUtils.generateCommonPanel(origin, [
          heading('Connect to Hedera Account'),
          text('Enter private key for the following account'),
          divider(),
          text(`Account Id: ${accountId}`),
        ]),
        placeholder: '2386d1d21644dc65d...',
      };
      const privateKey = (await SnapUtils.snapDialog(
        dialogParamsForPrivateKey,
      )) as string;

      try {
        console.log('mirrorNodeUrl', mirrorNodeUrl);
        const accountInfo: AccountInfo = await HederaUtils.getMirrorAccountInfo(
          accountId,
          mirrorNodeUrl,
        );

        let publicKey =
          PrivateKey.fromStringECDSA(privateKey).publicKey.toStringRaw();
        if (curve === 'ED25519') {
          publicKey =
            PrivateKey.fromStringED25519(privateKey).publicKey.toStringRaw();
        }
        if (_.isEmpty(accountInfo)) {
          console.error(
            `This Hedera account is not yet active. Please activate it by sending some HBAR to this account on '${network}'. Account Id: ${accountId} Public Key: ${publicKey}`,
          );
          throw providerErrors.custom({
            code: 4200,
            message: `This Hedera account is not yet active. Please activate it by sending some HBAR to this account on '${network}'. Account Id: ${accountId} Public Key: ${publicKey}`,
            data: { network, curve, accountId, publicKey },
          });
        }

        if (
          accountInfo.key.type === 'ProtobufEncoded' &&
          curve !== 'ECDSA_SECP256K1'
        ) {
          console.error(
            `You passed '${curve}' as the digital signature algorithm to use but the account was derived using 'ECDSA_SECP256K1' on '${network}'. Please make sure to pass in the correct value for "curve".`,
          );
          throw providerErrors.custom({
            code: 4200,
            message: `You passed '${curve}' as the digital signature algorithm to use but the account was derived using 'ECDSA_SECP256K1' on '${network}'. Please make sure to pass in the correct value for "curve".`,
            data: { network, curve, accountId, publicKey },
          });
        }

        if (
          accountInfo.key.type !== 'ProtobufEncoded' &&
          accountInfo.key.type !== curve
        ) {
          console.error(
            `You passed '${curve}' as the digital signature algorithm to use but the account was derived using '${accountInfo.key.type}' on '${network}'. Please make sure to pass in the correct value for "curve".`,
          );
          throw providerErrors.custom({
            code: 4200,
            message: `You passed '${curve}' as the digital signature algorithm to use but the account was derived using '${
              accountInfo.key.type ?? ''
            }' on '${network}'. Please make sure to pass in the correct value for "curve".`,
            data: { network, curve, accountId, publicKey },
          });
        }

        const hederaClientFactory = new HederaClientImplFactory(
          accountId,
          network,
          curve,
          privateKey,
        );
        const hederaClient = await hederaClientFactory.createClient();

        if (hederaClient) {
          result.privateKey = hederaClient
            ?.getPrivateKey()
            ?.toStringRaw() as string;
          result.curve = curve;
          result.publicKey = hederaClient.getPublicKey().toStringRaw();
          result.hederaAccountId = accountId;
          result.address = Utils.ensure0xPrefix(accountInfo.evmAddress);
          connectedAddress = Utils.ensure0xPrefix(accountInfo.evmAddress);
        } else {
          const dialogParamsForHederaAccountId: SnapDialogParams = {
            type: 'alert',
            content: await SnapUtils.generateCommonPanel(origin, [
              heading('Hedera Account Status'),
              text(
                `The private key you passed is not associated with the Hedera account '${accountId}' on '${network}' that uses the elliptic curve '${curve}'`,
              ),
            ]),
          };
          await SnapUtils.snapDialog(dialogParamsForHederaAccountId);

          console.error(
            `The private key you passed is not associated with the Hedera account '${accountId}' on '${network}' that uses the elliptic curve '${curve}'`,
          );
          throw providerErrors.custom({
            code: 4200,
            message: `The private key you passed is not associated with this Hedera account on '${network}' that uses the elliptic curve '${curve}'`,
            data: { network, curve, accountId, publicKey },
          });
        }
      } catch (error: any) {
        console.error(
          `Could not setup a Hedera client. Please try again: ${String(error)}`,
        );
        throw providerErrors.unsupportedMethod(
          `Could not setup a Hedera client. Please try again: ${String(error)}`,
        );
      }
    }

    return {
      connectedAddress,
      keyStore: result,
    };
  }

  /**
   * Veramo Import metamask account.
   *
   * @param _origin - Source.
   * @param state - HederaWalletSnapState.
   * @param network - Hedera network.
   * @param mirrorNode - Hedera mirror node URL.
   * @param connectedAddress - Currently connected EVm address.
   * @param metamaskEvmAddress - Metamask EVM address.
   * @param externalEvmAddress - External EVM address.
   * @param keyStore - Keystore for private, public keys and EVM address.
   */
  public static async importMetaMaskAccount(
    _origin: string,
    state: WalletSnapState,
    network: string,
    mirrorNode: string,
    connectedAddress: string,
    metamaskEvmAddress: string,
    externalEvmAddress: string,
    keyStore: KeyStore,
  ): Promise<void> {
    const { curve, privateKey, publicKey, address } = keyStore;

    console.log('Retrieving account info from Hedera Mirror node');
    const accountInfo: AccountInfo = await HederaUtils.getMirrorAccountInfo(
      address,
      mirrorNode,
    );
    if (_.isEmpty(accountInfo)) {
      console.error(
        `Could not get account info from Hedera Mirror Node on '${network}'. Address: ${address}. Please try again.`,
      );
      throw providerErrors.custom({
        code: 4200,
        message: `Could not get account info from Hedera Mirror Node on '${network}'. Address: ${address}. Please try again.`,
        data: address,
      });
    }

    // eslint-disable-next-line require-atomic-updates
    state.accountState[connectedAddress][network].mirrorNodeUrl = mirrorNode;
    // eslint-disable-next-line require-atomic-updates
    state.accountState[connectedAddress][network].accountInfo = accountInfo;

    // eslint-disable-next-line require-atomic-updates
    state.currentAccount = {
      metamaskEvmAddress,
      externalEvmAddress,
      hederaAccountId: accountInfo.accountId,
      hederaEvmAddress: accountInfo.evmAddress,
      balance: accountInfo.balance,
      network,
      mirrorNodeUrl: mirrorNode,
    } as Account;

    // eslint-disable-next-line require-atomic-updates
    state.accountState[connectedAddress][network].keyStore = {
      curve,
      privateKey,
      publicKey,
      address,
      hederaAccountId: accountInfo.accountId,
    };

    await SnapState.updateState(state);
  }
}
