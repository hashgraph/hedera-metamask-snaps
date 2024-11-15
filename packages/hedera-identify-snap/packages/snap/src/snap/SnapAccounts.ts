/*-
 *
 * Hedera Identify Snap
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { PrivateKey } from '@hashgraph/sdk';
import { rpcErrors } from '@metamask/rpc-errors';

import type { DialogParams } from '@metamask/snaps-sdk';
import { copyable, divider, heading, text } from '@metamask/snaps-sdk';
import { DidError, HcsDid } from '@tuum-tech/hedera-did-sdk-js';
import { IIdentifier, MinimalImportableKey } from '@veramo/core';
import { ethers, Wallet } from 'ethers';
import _ from 'lodash';
import { HederaClientImplFactory } from '../client/HederaClientImplFactory';
import { getDidKeyIdentifier } from '../did/key/keyDidUtils';
import type {
  Account,
  ExternalAccount,
  HederaAccountInfo,
} from '../types/account';
import type { IdentifySnapState, KeyStore } from '../types/state';
import { CryptoUtils } from '../utils/CryptoUtils';
import { EvmUtils } from '../utils/EvmUtils';
import { HederaUtils } from '../utils/HederaUtils';
import { SnapUtils } from '../utils/SnapUtils';
import { StateUtils } from '../utils/StateUtils';
import { Utils } from '../utils/Utils';
import { getVeramoAgent } from '../veramo/agent';
import { SnapState } from './SnapState';

export class SnapAccounts {
  /**
   * Function that creates an empty IdentitySnapState object in the Identity Snap state for the provided address.
   * @param state - WalletSnapState.
   * @param network - Hedera network.
   * @param evmAddress - The account address.
   */
  public static async initAccountState(
    state: IdentifySnapState,
    network: string,
    evmAddress: string,
  ): Promise<void> {
    state.currentAccount = { snapEvmAddress: evmAddress } as Account;
    if (_.isEmpty(state.accountState[evmAddress])) {
      state.accountState[evmAddress] = {};
    }

    state.accountState[evmAddress][network] = StateUtils.getEmptyAccountState();

    await SnapState.updateState(state);
  }

  /**
   * Check if Hedera account was imported.
   * @param state - WalletSnapState.
   * @param network - Hedera network.
   * @param evmAddress - Ethereum address.
   * @returns Result.
   */
  public static async getHederaAccountIdIfExists(
    state: IdentifySnapState,
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
   * @param origin - Source.
   * @param state - WalletSnapState.
   * @param params - Parameters that were passed by the user.
   * @param network - Hedera network.
   * @param isExternalAccount - Whether this is a metamask or a non-metamask account.
   * @param returnEarly - Whether to return early.
   * @returns Nothing.
   */
  public static async setCurrentAccount(
    origin: string,
    state: IdentifySnapState,
    params: unknown,
    network: string,
    isExternalAccount: boolean,
    returnEarly = false,
  ): Promise<string> {
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
            'ECDSA_SECP256K1',
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
              curve,
              (accountIdOrEvmAddress as string).toLowerCase(),
            );
          connectedAddress = _connectedAddress;
          keyStore = _keyStore;
        } catch (error: any) {
          const address = accountIdOrEvmAddress as string;
          const errMessage = `Could not connect to the Hedera account ${address} on ${network}`;
          console.error('Error occurred: %s', errMessage, String(error));
          throw rpcErrors.resourceNotFound({
            message: errMessage,
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
        const errMessage = `Failed to generate snap wallet for ${connectedAddress}`;
        console.log(errMessage);
        throw rpcErrors.internal(errMessage);
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

    return await SnapAccounts.importMetaMaskAccount(
      origin,
      state,
      network,
      connectedAddress,
      metamaskEvmAddress,
      externalEvmAddress,
      keyStore,
      returnEarly,
    );
  }

  /**
   * Connect EVM Account.
   * @param origin - Source.
   * @param state - Wallet state.
   * @param network - Hedera network.
   * @param curve - Public Key curve('ECDSA_SECP256K1' | 'ED25519').
   * @param evmAddress - EVM Account address.
   * @returns Result.
   */
  public static async connectEVMAccount(
    origin: string,
    state: IdentifySnapState,
    network: string,
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
            const errMessage = `You passed '${curve}' as the digital signature algorithm to use but the account was derived using ${keyStore.curve} on '${network}'. Please make sure to pass in the correct value for "curve".`;
            console.log(errMessage);
            throw rpcErrors.invalidRequest({
              message: errMessage,
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
      const dialogParamsForPrivateKey: DialogParams = {
        type: 'prompt',
        content: await SnapUtils.generateCommonPanel(origin, network, [
          heading('Connect to EVM Account'),
          divider(),
          text(`EVM Address:`),
          copyable(evmAddress),
        ]),
        placeholder: '2386d1d21644dc65d...',
      };
      const privateKey = (await SnapUtils.snapDialog(
        dialogParamsForPrivateKey,
      )) as string;

      try {
        const { mirrorNodeUrl } = HederaUtils.getHederaNetworkInfo(network);

        const accountInfo: HederaAccountInfo =
          await HederaUtils.getMirrorAccountInfo(evmAddress, mirrorNodeUrl);

        const publicKey =
          PrivateKey.fromStringECDSA(privateKey).publicKey.toStringRaw();
        if (!_.isEmpty(accountInfo)) {
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
            const dialogParamsForHederaAccountId: DialogParams = {
              type: 'alert',
              content: await SnapUtils.generateCommonPanel(origin, network, [
                heading('Hedera Account Status'),
                text(
                  `The private key you passed is not associated with the Hedera account '${evmAddress}' on '${network}' that uses the elliptic curve '${curve}'`,
                ),
              ]),
            };
            await SnapUtils.snapDialog(dialogParamsForHederaAccountId);

            const errMessage = `The private key you passed is not associated with the Hedera account '${result.address}' on '${network}' that uses the elliptic curve '${curve}'`;
            console.error(errMessage);
            throw rpcErrors.invalidRequest({
              message: errMessage,
              data: { network, curve, address: evmAddress, publicKey },
            });
          }
        } else {
          const wallet: Wallet = new ethers.Wallet(privateKey);
          result.curve = 'ECDSA_SECP256K1';
          result.privateKey = privateKey;
          result.publicKey = wallet.signingKey.publicKey;
          result.address = wallet.address.toLowerCase();
          connectedAddress = wallet.address.toLowerCase();
        }
      } catch (error: any) {
        const errMessage = `Could not connect to EVM account. Please try again`;
        console.error('Error occurred: %s', errMessage, String(error));
        await SnapUtils.snapNotification(
          `Error occurred: ${errMessage} - ${String(error)}`,
        );
        throw rpcErrors.transactionRejected(errMessage);
      }
    }

    return {
      connectedAddress,
      keyStore: result,
    };
  }

  /**
   * Connect Hedera Account.
   * @param origin - Source.
   * @param state - Wallet state.
   * @param network - Hedera network.
   * @param curve - Public Key curve('ECDSA_SECP256K1' | 'ED25519').
   * @param accountId - Hedera Account id.
   * @returns Result.
   */
  public static async connectHederaAccount(
    origin: string,
    state: IdentifySnapState,
    network: string,
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
            const errMessage = `You passed '${curve}' as the digital signature algorithm to use but the account was derived using ${keyStore.curve} on '${network}'. Please make sure to pass in the correct value for "curve".`;
            console.error(errMessage);
            throw rpcErrors.invalidRequest({
              message: errMessage,
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
      const dialogParamsForPrivateKey: DialogParams = {
        type: 'prompt',
        content: await SnapUtils.generateCommonPanel(origin, network, [
          heading('Connect to Hedera Account'),
          text('Enter private key for the following account'),
          divider(),
          text(`Account Id:`),
          copyable(accountId),
        ]),
        placeholder: '2386d1d21644dc65d...',
      };
      const privateKey = (await SnapUtils.snapDialog(
        dialogParamsForPrivateKey,
      )) as string;

      try {
        const { mirrorNodeUrl } = HederaUtils.getHederaNetworkInfo(network);
        const accountInfo: HederaAccountInfo =
          await HederaUtils.getMirrorAccountInfo(accountId, mirrorNodeUrl);

        let publicKey =
          PrivateKey.fromStringECDSA(privateKey).publicKey.toStringRaw();
        if (curve === 'ED25519') {
          publicKey =
            PrivateKey.fromStringED25519(privateKey).publicKey.toStringRaw();
        }
        if (_.isEmpty(accountInfo)) {
          const errMessage = `This Hedera account is not yet active. Please activate it by sending some HBAR to this account on '${network}'. Account Id: ${accountId} Public Key: ${publicKey}`;
          console.error(errMessage);
          throw rpcErrors.resourceNotFound({
            message: errMessage,
            data: { network, curve, accountId, publicKey },
          });
        }

        if (
          accountInfo.key.type === 'ProtobufEncoded' &&
          curve !== 'ECDSA_SECP256K1'
        ) {
          const errMessage = `You passed '${curve}' as the digital signature algorithm to use but the account was derived using 'ECDSA_SECP256K1' on '${network}'. Please make sure to pass in the correct value for "curve".`;
          console.error(errMessage);
          throw rpcErrors.invalidRequest({
            message: errMessage,
            data: { network, curve, accountId, publicKey },
          });
        }

        if (
          accountInfo.key.type !== 'ProtobufEncoded' &&
          accountInfo.key.type !== curve
        ) {
          const errMessage = `You passed '${curve}' as the digital signature algorithm to use but the account was derived using '${accountInfo.key.type}' on '${network}'. Please make sure to pass in the correct value for "curve".`;
          console.error(errMessage);
          throw rpcErrors.invalidRequest({
            message: errMessage,
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
          const dialogParamsForHederaAccountId: DialogParams = {
            type: 'alert',
            content: await SnapUtils.generateCommonPanel(origin, network, [
              heading('Hedera Account Status'),
              text(
                `The private key you passed is not associated with the Hedera account '${accountId}' on '${network}' that uses the elliptic curve '${curve}'`,
              ),
            ]),
          };
          await SnapUtils.snapDialog(dialogParamsForHederaAccountId);

          const errMessage = `The private key you passed is not associated with the Hedera account '${accountId}' on '${network}' that uses the elliptic curve '${curve}'`;
          console.error(errMessage);
          throw rpcErrors.invalidRequest({
            message: errMessage,
            data: { network, curve, accountId, publicKey },
          });
        }
      } catch (error: any) {
        const errMessage = `Could not setup a Hedera client. Please try again`;
        console.error('Error occurred: %s', errMessage, String(error));
        await SnapUtils.snapNotification(
          `Error occurred: ${errMessage} - ${String(error)}`,
        );
        throw rpcErrors.transactionRejected(errMessage);
      }
    }

    return {
      connectedAddress,
      keyStore: result,
    };
  }

  /**
   * Veramo Import metamask account.
   * @param _origin - Source.
   * @param state - HederaWalletSnapState.
   * @param network - Hedera network.
   * @param connectedAddress - Currently connected EVm address.
   * @param metamaskEvmAddress - Metamask EVM address.
   * @param externalEvmAddress - External EVM address.
   * @param keyStore - Keystore for private, public keys and EVM address.
   * @param returnEarly - Whether to return early.
   * @returns Result.
   */
  public static async importMetaMaskAccount(
    origin: string,
    state: IdentifySnapState,
    network: string,
    connectedAddress: string,
    metamaskEvmAddress: string,
    externalEvmAddress: string,
    keyStore: KeyStore,
    returnEarly = false,
  ): Promise<string> {
    const { curve, privateKey, publicKey, address } = keyStore;

    console.log('Retrieving account info from Hedera Mirror node');
    const { hederaNetwork, mirrorNodeUrl } =
      HederaUtils.getHederaNetworkInfo(network);
    const accountInfo: HederaAccountInfo =
      await HederaUtils.getMirrorAccountInfo(address, mirrorNodeUrl);

    const method = state.snapConfig.dApp.didMethod;
    if (_.isEmpty(accountInfo)) {
      if (method === 'did:hedera') {
        const errMessage = `Could not get account info from Hedera Mirror Node on '${network}'. Address: ${address}. Please try again.`;
        console.error(errMessage);
        if (returnEarly) {
          // eslint-disable-next-line require-atomic-updates
          state.accountState[connectedAddress][network].keyStore = {
            curve,
            privateKey,
            publicKey,
            address,
            hederaAccountId: '',
          };

          await SnapState.updateState(state);
          return address;
        }
        throw rpcErrors.resourceNotFound({
          message: errMessage,
          data: address,
        });
      }
      accountInfo.accountId = '';
      accountInfo.evmAddress = address;
      accountInfo.key = {
        type: curve,
        key: publicKey,
      };
    }

    // eslint-disable-next-line require-atomic-updates
    state.accountState[connectedAddress][network].accountInfo = accountInfo;

    // eslint-disable-next-line require-atomic-updates
    state.currentAccount = {
      metamaskEvmAddress,
      externalEvmAddress,
      method,
      hederaAccountId: accountInfo.accountId,
      snapEvmAddress: accountInfo.evmAddress,
      privateKey,
      publicKey,
      network,
    } as Account;

    // eslint-disable-next-line require-atomic-updates
    state.accountState[connectedAddress][network].keyStore = {
      curve,
      privateKey,
      publicKey,
      address,
      hederaAccountId: accountInfo.accountId,
    };

    let did = '';
    if (method === 'did:pkh') {
      did = `did:pkh:eip155:${EvmUtils.convertChainIdFromHex(network)}:${address}`;
    } else if (method === 'did:key') {
      did = `did:key:${await getDidKeyIdentifier(publicKey)}`;
    } else if (method === 'did:hedera') {
      const hederaClientFactory = new HederaClientImplFactory(
        accountInfo.accountId,
        hederaNetwork,
        curve,
        privateKey,
      );
      const client = await hederaClientFactory.createClient();
      if (!client) {
        console.error('Failed to create Hedera client');
        throw new Error('Failed to create Hedera client');
      }

      let didToUse = new HcsDid({
        privateKey: PrivateKey.fromStringECDSA(privateKey),
        client: client.getClient(),
      });
      // Try registering the DID if not registered previously
      try {
        const registeredDid = await didToUse.register();
        did = registeredDid.getIdentifier() || '';
      } catch (e: any) {
        if (e instanceof DidError) {
          const didDocument = await didToUse.resolve();
          did = didDocument.getId();
        } else {
          console.error(`Failed to register DID: ${e}`);
          throw new Error(`Failed to register DID: ${e}`);
        }
      }
      did = `did:hedera:${accountInfo.accountId}`;
    }

    console.log('did : ', did);
    if (!did) {
      console.log('Failed to generate DID');
      throw new Error('Failed to generate DID');
    }

    // Get Veramo agent
    const agent = await getVeramoAgent(state);
    const controllerKeyId = `metamask-${address}`;
    console.log(
      `Importing using did=${did}, provider=${method}, controllerKeyId=${controllerKeyId}...`,
    );

    let identifier: IIdentifier;
    // Get identifier if it exists
    try {
      identifier = await agent.didManagerGet({
        did,
      });
    } catch (error) {
      try {
        identifier = await agent.didManagerImport({
          did,
          provider: method,
          controllerKeyId,
          keys: [
            {
              kid: controllerKeyId,
              type: 'Secp256k1',
              kms: 'snap',
              privateKeyHex: privateKey.split('0x')[1],
              publicKeyHex: publicKey.split('0x')[1],
            } as MinimalImportableKey,
          ],
        });
      } catch (e) {
        console.log(`Error while creating identifier: ${(e as Error).message}`);
        throw new Error(
          `Error while creating identifier: ${(e as Error).message}`,
        );
      }
    }

    await SnapState.updateState(state);

    return address;
  }
}
