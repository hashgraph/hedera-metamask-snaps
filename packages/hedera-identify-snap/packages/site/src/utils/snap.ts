/* eslint-disable @typescript-eslint/ban-types */
import {
  Filter,
  IDataManagerClearArgs,
  IDataManagerDeleteArgs,
} from '@tuum-tech/identify/src/plugins/veramo/verifiable-creds-manager';
import {
  CreateNewHederaAccountRequestParams,
  CreateVPRequestParams,
} from '@tuum-tech/identify/src/types/params';

import { VerifiableCredential, VerifiablePresentation } from '@veramo/core';
import { defaultSnapId } from '../config/snap';
import { ExternalAccountParams, GetSnapsResponse, Snap } from '../types';
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

export const sendHello = async (metamaskAddress: string) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'hello',
        params: { metamaskAddress },
      },
    },
  });
};

/**
 * Invoke the "togglePopups" method from the snap.
 */

export const togglePopups = async (metamaskAddress: string) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: { method: 'togglePopups', params: { metamaskAddress } },
    },
  });
};

/**
 * Invoke the "getAccountInfo" method from the snap.
 */

export const getAccountInfo = async (
  metamaskAddress: string,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'getAccountInfo',
        params: { metamaskAddress, ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke "createNewHederaAccount" method from the snap
 */

export const createNewHederaAccount = async (
  metamaskAddress: string,
  {
    hbarAmountToSend,
    newAccountPublickey = '',
    newAccountEvmAddress = '',
  }: CreateNewHederaAccountRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  if (newAccountPublickey) {
    return await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: defaultSnapId,
        request: {
          method: 'createNewHederaAccount',
          params: {
            metamaskAddress,
            hbarAmountToSend,
            newAccountPublickey,
            ...externalAccountparams,
          },
        },
      },
    });
  }
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'createNewHederaAccount',
        params: {
          metamaskAddress,
          hbarAmountToSend,
          newAccountEvmAddress,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "resolveDID" method from the snap.
 */

export const resolveDID = async (
  metamaskAddress: string,
  did?: string,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'resolveDID',
        params: { metamaskAddress, did, ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "getVCs" method from the snap.
 */

export const getVCs = async (
  metamaskAddress: string,
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
        params: { metamaskAddress, filter, options, ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "saveVC" method from the snap.
 */

export const saveVC = async (
  metamaskAddress: string,
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
          metamaskAddress,
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
  metamaskAddress: string,
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
          metamaskAddress,
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

export const verifyVC = async (
  metamaskAddress: string,
  vc: VerifiableCredential | {},
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'verifyVC',
        params: { metamaskAddress, verifiableCredential: vc },
      },
    },
  });
};

/**
 * Invoke the "removeVC" method from the snap.
 */

export const removeVC = async (
  metamaskAddress: string,
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
        params: { metamaskAddress, id, options, ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "deleteAllVCs" method from the snap.
 */

export const deleteAllVCs = async (
  metamaskAddress: string,
  options: IDataManagerClearArgs,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'deleteAllVCs',
        params: { metamaskAddress, options, ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "createVP" method from the snap.
 */

export const createVP = async (
  metamaskAddress: string,
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
          metamaskAddress,
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

export const verifyVP = async (
  metamaskAddress: string,
  vp: VerifiablePresentation | {},
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'verifyVP',
        params: { metamaskAddress, verifiablePresentation: vp },
      },
    },
  });
};

/**
 * Invoke the "getCurrentDIDMethod" method from the snap.
 */

export const getCurrentDIDMethod = async (
  metamaskAddress: string,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'getCurrentDIDMethod',
        params: { metamaskAddress, ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "configureGoogleAccount" method from the snap.
 */

export const configureGoogleAccount = async (
  metamaskAddress: string,
  accessToken: string,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'configureGoogleAccount',
        params: { metamaskAddress, accessToken, ...externalAccountparams },
      },
    },
  });
};

/**
 * Invoke the "syncGoogleVCs" method from the snap.
 */

export const syncGoogleVCs = async (
  metamaskAddress: string,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapId,
      request: {
        method: 'syncGoogleVCs',
        params: { metamaskAddress, ...externalAccountparams },
      },
    },
  });
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');
