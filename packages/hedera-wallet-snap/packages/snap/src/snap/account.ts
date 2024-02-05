/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Tuum Tech
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
import { providerErrors } from '@metamask/rpc-errors';
import { divider, heading, text } from '@metamask/snaps-ui';
import { ethers } from 'ethers';
import _ from 'lodash';
import { SimpleHederaClient } from '../services/hedera';
import { HederaServiceImpl, getHederaClient } from '../services/impl/hedera';
import {
  Account,
  AccountInfo,
  ExternalAccount,
  NetworkParams,
} from '../types/account';
import { hederaNetworks } from '../types/constants';
import { KeyStore, SnapDialogParams, WalletSnapState } from '../types/state';
import { generateWallet } from '../utils/crypto';
import { generateCommonPanel, snapDialog } from './dialog';
import { validHederaNetwork } from './network';
import {
  getHederaAccountIdIfExists,
  initAccountState,
  updateSnapState,
} from './state';

const getCurrentMetamaskAccount = async (): Promise<string> => {
  const accounts = (await ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];
  return accounts[0];
};

/**
 * Adds the prefix to the EVM address.
 *
 * @param address - EVM Account address.
 * @returns EVM address.
 */
function ensure0xPrefix(address: string): string {
  let result = address;
  if (!address.startsWith('0x')) {
    result = `0x${address}`;
  }
  return result.toLowerCase();
}

/**
 * Function that returns account info of the currently selected MetaMask account.
 *
 * @param origin - Source.
 * @param state - WalletSnapState.
 * @param params - Parameters that were passed by the user.
 * @param mirrorNodeUrl - Hedera mirror node URL.
 * @param isExternalAccount - Whether this is a metamask or a non-metamask account.
 * @returns MetaMask Hedera client.
 */
export async function setCurrentAccount(
  origin: string,
  state: WalletSnapState,
  params: unknown,
  mirrorNodeUrl: string,
  isExternalAccount: boolean,
): Promise<void> {
  try {
    const { network = 'mainnet' } = (params ?? {}) as NetworkParams;
    if (!validHederaNetwork(network)) {
      console.error(
        `Invalid Hedera network '${network}'. Valid networks are '${hederaNetworks.join(
          ', ',
        )}'`,
      );

      throw providerErrors.unsupportedMethod(
        `Invalid Hedera network '${network}'. Valid networks are '${hederaNetworks.join(
          ', ',
        )}'`,
      );
    }

    let connectedAddress = '';
    let keyStore = {} as KeyStore;
    // Handle external account(non-metamask account)
    if (isExternalAccount) {
      const nonMetamaskAccount = params as ExternalAccount;
      const { accountIdOrEvmAddress, curve = 'ECDSA_SECP256K1' } =
        nonMetamaskAccount.externalAccount;
      if (ethers.isAddress(accountIdOrEvmAddress)) {
        const { connectedAddress: _connectedAddress, keyStore: _keyStore } =
          await connectEVMAccount(
            origin,
            state,
            network,
            mirrorNodeUrl,
            curve,
            ensure0xPrefix(accountIdOrEvmAddress),
          );
        connectedAddress = _connectedAddress;
        keyStore = _keyStore;
      } else {
        try {
          const { connectedAddress: _connectedAddress, keyStore: _keyStore } =
            await connectHederaAccount(
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
    } else {
      // Handle metamask connected account
      connectedAddress = await getCurrentMetamaskAccount();
      // Generate a new wallet according to the Hedera Wallet's entrophy combined with the currently connected EVM address
      const res = await generateWallet(connectedAddress);
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
      keyStore.hederaAccountId = await getHederaAccountIdIfExists(
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
      await initAccountState(state, network, connectedAddress);
    }

    await importMetaMaskAccount(
      origin,
      state,
      network,
      mirrorNodeUrl,
      connectedAddress,
      keyStore,
    );
  } catch (error: any) {
    console.error(`Error while trying to get the account: ${String(error)}`);
    throw error;
  }
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
async function connectEVMAccount(
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
      content: await generateCommonPanel(origin, [
        heading('Connect to EVM Account'),
        text('Enter private key for the following account'),
        divider(),
        text(`EVM Address: ${evmAddress}`),
      ]),
      placeholder: '2386d1d21644dc65d...',
    };
    const privateKey = (await snapDialog(dialogParamsForPrivateKey)) as string;

    try {
      const hederaService = new HederaServiceImpl(network, mirrorNodeUrl);
      const accountInfo: AccountInfo = await hederaService.getMirrorAccountInfo(
        evmAddress,
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

      const hederaClient = await getHederaClient(
        curve,
        privateKey,
        accountInfo.accountId,
        network,
      );
      if (hederaClient) {
        result.curve = curve;
        result.privateKey = privateKey;
        result.publicKey = publicKey;
        result.address = ensure0xPrefix(accountInfo.evmAddress);
        result.hederaAccountId = accountInfo.accountId;
        connectedAddress = ensure0xPrefix(accountInfo.evmAddress);
      } else {
        const dialogParamsForHederaAccountId: SnapDialogParams = {
          type: 'alert',
          content: await generateCommonPanel(origin, [
            heading('Hedera Account Status'),
            text(
              `The private key you passed is not associated with the Hedera account '${evmAddress}' on '${network}' that uses the elliptic curve '${curve}'`,
            ),
          ]),
        };
        await snapDialog(dialogParamsForHederaAccountId);

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
async function connectHederaAccount(
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
      content: await generateCommonPanel(origin, [
        heading('Connect to Hedera Account'),
        text('Enter private key for the following account'),
        divider(),
        text(`Account Id: ${accountId}`),
      ]),
      placeholder: '2386d1d21644dc65d...',
    };
    const privateKey = (await snapDialog(dialogParamsForPrivateKey)) as string;

    try {
      const hederaService = new HederaServiceImpl(network, mirrorNodeUrl);
      const accountInfo: AccountInfo = await hederaService.getMirrorAccountInfo(
        accountId,
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

      const hederaClient = await getHederaClient(
        curve,
        privateKey,
        accountId,
        network,
      );
      if (hederaClient) {
        result.privateKey = hederaClient
          ?.getPrivateKey()
          ?.toStringRaw() as string;
        result.curve = curve;
        result.publicKey = hederaClient.getPublicKey().toStringRaw();
        result.hederaAccountId = accountId;
        result.address = ensure0xPrefix(accountInfo.evmAddress);
        connectedAddress = ensure0xPrefix(accountInfo.evmAddress);
      } else {
        const dialogParamsForHederaAccountId: SnapDialogParams = {
          type: 'alert',
          content: await generateCommonPanel(origin, [
            heading('Hedera Account Status'),
            text(
              `The private key you passed is not associated with the Hedera account '${accountId}' on '${network}' that uses the elliptic curve '${curve}'`,
            ),
          ]),
        };
        await snapDialog(dialogParamsForHederaAccountId);

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
 * @param state - IdentitySnapState.
 * @param network - Hedera network.
 * @param mirrorNode - Hedera mirror node URL.
 * @param connectedAddress - Currently connected EVm address.
 * @param keyStore - Keystore for private, public keys and EVM address.
 */
export async function importMetaMaskAccount(
  _origin: string,
  state: WalletSnapState,
  network: string,
  mirrorNode: string,
  connectedAddress: string,
  keyStore: KeyStore,
): Promise<void> {
  const { curve, privateKey, publicKey, address } = keyStore;

  let { mirrorNodeUrl } = state.accountState[connectedAddress][network];
  if (!_.isEmpty(mirrorNode)) {
    mirrorNodeUrl = mirrorNode;
  }

  console.log('Retrieving account info from Hedera Mirror node');
  const hederaService = new HederaServiceImpl(network, mirrorNodeUrl);
  mirrorNodeUrl = hederaService.mirrorNodeUrl;
  const accountInfo: AccountInfo = await hederaService.getMirrorAccountInfo(
    address,
  );
  if (_.isEmpty(accountInfo)) {
    console.error(
      `Could not get account info from Hedera Mirror Node for ${address}. Please try again.`,
    );
    throw providerErrors.custom({
      code: 4200,
      message: `Could not get account info from Hedera Mirror Node for ${address}. Please try again.`,
      data: address,
    });
  }

  // eslint-disable-next-line require-atomic-updates
  state.accountState[connectedAddress][network].mirrorNodeUrl = mirrorNodeUrl;
  // eslint-disable-next-line require-atomic-updates
  state.accountState[connectedAddress][network].accountInfo = accountInfo;

  // eslint-disable-next-line require-atomic-updates
  state.currentAccount = {
    hederaAccountId: accountInfo.accountId,
    hederaEvmAddress: accountInfo.evmAddress,
    balance: accountInfo.balance,
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

  await updateSnapState(state);
}

/**
 * Create Hedera Client to use for transactions.
 *
 * @param curve - Curve that was used to derive the keys('ECDSA_SECP256K1' | 'ED25519').
 * @param privateKey - Private key of the account.
 * @param hederaAccountId - Hedera Account ID.
 * @param network - Hedera network.
 */
export async function createHederaClient(
  curve: string,
  privateKey: string,
  hederaAccountId: string,
  network: string,
): Promise<SimpleHederaClient> {
  const hederaClient = await getHederaClient(
    curve,
    privateKey,
    hederaAccountId,
    network,
  );
  if (!hederaClient) {
    console.error(
      `Could not setup a Hedera client with '${hederaAccountId}' at this time. Please try again later.`,
    );
    throw providerErrors.custom({
      code: 4200,
      message: `Could not setup a Hedera client with ${hederaAccountId} on ${network} at this time. Please try again later.`,
      data: hederaAccountId,
    });
  }

  return hederaClient;
}
