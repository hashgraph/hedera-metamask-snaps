/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2023 Tuum Tech
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

import { MetaMaskInpageProvider } from '@metamask/providers';
import { defaultSnapOrigin } from '../config';
import { ExternalAccountParams, GetSnapsResponse, Snap } from '../types';
import {
  GetAccountInfoRequestParams,
  TransferCryptoRequestParams,
} from '../types/snap';

export const getCurrentMetamaskAccount = async (): Promise<string> => {
  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];
  return accounts[0];
};

export const getCurrentNetwork = async (): Promise<string> => {
  return (await window.ethereum.request({
    method: 'eth_chainId',
  })) as string;
};

/**
 * Get the installed snaps in MetaMask.
 *
 * @param provider - The MetaMask inpage provider.
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (
  provider?: MetaMaskInpageProvider,
): Promise<GetSnapsResponse> =>
  (await (provider ?? window.ethereum).request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse;
/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<'version' | string, unknown> = {},
): Promise<string> => {
  try {
    const hederaPulseSnap = await window.ethereum.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: params,
      },
    });
    console.log(
      'Hedera Pulse Snap Details: ',
      JSON.stringify(hederaPulseSnap, null, 4),
    );
    const account = await getCurrentMetamaskAccount();
    console.log('Metamask account: ', account);
    return account;
  } catch (error) {
    console.log('Could not connect to Identify Snap: ', error);
    return '';
  }
};

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (version?: string): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version),
    );
  } catch (e) {
    console.log('Failed to obtain installed snap', e);
    return undefined;
  }
};

/**
 * Invoke the "hello" method from the snap.
 */

export const sendHello = async (network: string, mirrorNodeUrl: string) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hello',
        params: { network, mirrorNodeUrl },
      },
    },
  });
};

/**
 * Invoke the "getAccountInfo" method from the snap.
 */

export const getAccountInfo = async (
  network: string,
  mirrorNodeUrl: string,
  getAccountInfoParams: GetAccountInfoRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'getAccountInfo',
        params: {
          network,
          mirrorNodeUrl,
          accountId: getAccountInfoParams.accountId,
          serviceFee: getAccountInfoParams.serviceFee,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "getAccountBalance" method from the snap.
 */

export const getAccountBalance = async (
  network: string,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'getAccountBalance',
        params: { network, ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "transferCrypto" method from the snap.
 */

export const transferCrypto = async (
  network: string,
  mirrorNodeUrl: string,
  transferCryptoParams: TransferCryptoRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'transferCrypto',
        params: {
          network,
          mirrorNodeUrl,
          transfers: transferCryptoParams.transfers,
          memo: transferCryptoParams.memo,
          maxFee: transferCryptoParams.maxFee,
          serviceFee: transferCryptoParams.serviceFee,
          ...externalAccountparams,
        },
      },
    },
  });
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');
