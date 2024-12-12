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

/* eslint-disable @typescript-eslint/ban-types */
import { VerifiableCredential, VerifiablePresentation } from '@veramo/core';
import { defaultSnapId } from '../config/snap';
import { ExternalAccountParams, GetSnapsResponse, Snap } from '../types';
import { CreateVPRequestParams } from '../types/snap';
import {
  Filter,
  IDataManagerClearArgs,
  IDataManagerDeleteArgs,
} from '../types/veramo';
/**
 * Get the installed snaps in MetaMask.
 *
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (): Promise<GetSnapsResponse> => {
  return (await window.ethereum.request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse;
};

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap, params - The params to pass with the snap to connect.
 */
export const connectSnap = async (snapId: string = defaultSnapId) => {
  try {
    const identifySnap = await window.ethereum.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: {},
      },
    });
    console.log(
      'Identify Snap Details: ',
      JSON.stringify(identifySnap, null, 4),
    );
    const account = await getCurrentMetamaskAccount();
    console.log('Metamask account: ', account);
    return account;
  } catch (error) {
    console.log('Could not connect to Identify Snap: ', error);
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
        snap.id === defaultSnapId && (!version || snap.version === version),
    );
  } catch (e) {
    console.log('Failed to obtain installed snap', e);
    return undefined;
  }
};

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
 * Invoke the "hello" method from the snap.
 */

export const sendHello = async () => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'hello',
        params: {},
      },
    },
  });
};

/**
 * Invoke the "togglePopups" method from the snap.
 */

export const togglePopups = async () => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: { method: 'togglePopups', params: {} },
    },
  });
};

/**
 * Invoke the "switchDIDMethod" method from the snap.
 */
export const switchDIDMethod = async (didMethod: string) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'switchDIDMethod',
        params: { didMethod },
      },
    },
  });
};

/**
 * Invoke the "getAccountInfo" method from the snap.
 */
export const getAccountInfo = async (
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'getAccountInfo',
        params: { ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "resolveDID" method from the snap.
 */
export const resolveDID = async (
  did?: string,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'resolveDID',
        params: {
          ...(did ? { did } : {}),
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "getVCs" method from the snap.
 */

export const getVCs = async (
  filter: Filter | undefined,
  options: any,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'getVCs',
        params: { filter, options, ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "saveVC" method from the snap.
 */

export const saveVC = async (
  data: unknown,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'saveVC',
        params: {
          data,
          ...externalAccountparams,
        },
      },
    },
  });
};

export type ExampleVCValue = {
  name: string;
  value: string;
};

/**
 * Invoke the "createVC" method from the snap.
 */

export const createVC = async (
  vcKey: string,
  vcValue: object,
  options: any,
  credTypes?: string[],
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'createVC',
        params: {
          vcKey,
          vcValue,
          options,
          credTypes,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "verifyVC" method from the snap.
 */

export const verifyVC = async (vc: VerifiableCredential | {}) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'verifyVC',
        params: { verifiableCredential: vc },
      },
    },
  });
};

/**
 * Invoke the "removeVC" method from the snap.
 */

export const removeVC = async (
  id: string | string[],
  options: IDataManagerDeleteArgs,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'removeVC',
        params: { id, options, ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "deleteAllVCs" method from the snap.
 */

export const deleteAllVCs = async (
  options: IDataManagerClearArgs,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'deleteAllVCs',
        params: { options, ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "createVP" method from the snap.
 */

export const createVP = async (
  { vcIds, vcs, proofInfo }: CreateVPRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'createVP',
        params: {
          vcIds,
          vcs,
          proofInfo,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "verifyVP" method from the snap.
 */

export const verifyVP = async (vp: VerifiablePresentation | {}) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'verifyVP',
        params: { verifiablePresentation: vp },
      },
    },
  });
};

/**
 * Invoke the "getCurrentDIDMethod" method from the snap.
 */

export const getCurrentDIDMethod = async (
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'getCurrentDIDMethod',
        params: { ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "configureGoogleAccount" method from the snap.
 */

export const configureGoogleAccount = async (
  accessToken: string,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'configureGoogleAccount',
        params: { accessToken, ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "syncGoogleVCs" method from the snap.
 */

export const syncGoogleVCs = async (
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'syncGoogleVCs',
        params: { ...externalAccountparams },
      },
    },
  });
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');
