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

import { MetaMaskInpageProvider } from '@metamask/providers';
import { defaultSnapOrigin } from '../config';
import { ExternalAccountParams, GetSnapsResponse, Snap } from '../types';
import {
  ApproveAllowanceRequestParams,
  AssociateTokensRequestParams,
  DeleteAccountRequestParams,
  DeleteAllowanceRequestParams,
  GetAccountInfoRequestParams,
  GetTransactionsRequestParams,
  SignMessageRequestParams,
  StakeHbarRequestParams,
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
 * Invoke the "getCurrentAccount" method from the snap.
 */
export const getCurrentAccount = async (
  network: string,
  mirrorNodeUrl: string,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'getCurrentAccount',
        params: {
          network,
          mirrorNodeUrl,
          ...externalAccountparams,
        },
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
 * Invoke the "getTransactions" method from the snap.
 */

export const getTransactions = async (
  network: string,
  mirrorNodeUrl: string,
  getTransactionsParams: GetTransactionsRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'getTransactions',
        params: {
          network,
          mirrorNodeUrl,
          transactionId: getTransactionsParams.transactionId,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "associateTokens" method from the snap.
 */
export const associateTokens = async (
  network: string,
  mirrorNodeUrl: string,
  associateTokensRequestParams: AssociateTokensRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/associateTokens',
        params: {
          network,
          mirrorNodeUrl,
          tokenIds: associateTokensRequestParams.tokenIds,
          ...externalAccountparams,
        },
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

/**
 * Invoke the "signMessage" method from the snap.
 */
export const signMessage = async (
  network: string,
  mirrorNodeUrl: string,
  signMessageRequestParams: SignMessageRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'signMessage',
        params: {
          network,
          mirrorNodeUrl,
          message: signMessageRequestParams.message,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "stakeHbar" method from the snap.
 */
export const stakeHbar = async (
  network: string,
  mirrorNodeUrl: string,
  stakeHbarParams: StakeHbarRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'stakeHbar',
        params: {
          network,
          mirrorNodeUrl,
          nodeId: stakeHbarParams.nodeId,
          accountId: stakeHbarParams.accountId,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "approveAllowance" method from the snap.
 */
export const approveAllowance = async (
  network: string,
  mirrorNodeUrl: string,
  approveAllowanceParams: ApproveAllowanceRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'approveAllowance',
        params: {
          network,
          mirrorNodeUrl,
          spenderAccountId: approveAllowanceParams.spenderAccountId,
          amount: approveAllowanceParams.amount,
          assetType: approveAllowanceParams.assetType,
          assetDetail: approveAllowanceParams.assetDetail,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "deleteAllowance" method from the snap.
 */
export const deleteAllowance = async (
  network: string,
  mirrorNodeUrl: string,
  deleteAllowanceParams: DeleteAllowanceRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'deleteAllowance',
        params: {
          network,
          mirrorNodeUrl,
          assetType: deleteAllowanceParams.assetType,
          assetId: deleteAllowanceParams.assetId,
          spenderAccountId: deleteAllowanceParams.spenderAccountId,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "deleteAccount" method from the snap.
 */
export const deleteAccount = async (
  network: string,
  mirrorNodeUrl: string,
  deleteAccountParams: DeleteAccountRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'deleteAccount',
        params: {
          network,
          mirrorNodeUrl,
          transferAccountId: deleteAccountParams.transferAccountId,
          ...externalAccountparams,
        },
      },
    },
  });
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');
