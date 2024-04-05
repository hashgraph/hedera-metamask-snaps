/*-
 *
 * Hedera Wallet Snap
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

import type { MetaMaskInpageProvider } from '@metamask/providers';
import { defaultSnapOrigin } from '../config';
import type { ExternalAccountParams, GetSnapsResponse, Snap } from '../types';
import type {
  ApproveAllowanceRequestParams,
  AssociateTokensRequestParams,
  BurnTokenRequestParams,
  CreateTokenRequestParams,
  DeleteAccountRequestParams,
  DeleteAllowanceRequestParams,
  DissociateTokensRequestParams,
  FreezeOrEnableKYCAccountRequestParams,
  GetAccountInfoRequestParams,
  GetTransactionsRequestParams,
  InitiateSwapRequestParams,
  MintTokenRequestParams,
  PauseOrDeleteTokenRequestParams,
  SignMessageRequestParams,
  SignScheduledTxParams,
  StakeHbarRequestParams,
  TransferCryptoRequestParams,
  UpdateTokenFeeScheduleRequestParams,
  UpdateTokenRequestParams,
  WipeTokenRequestParams,
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
 * @param network
 * @param mirrorNodeUrl
 * @param externalAccountparams
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
          ...getAccountInfoParams,
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
          ...getTransactionsParams,
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
          ...transferCryptoParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "signMessage" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param signMessageRequestParams
 * @param externalAccountparams
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
          ...signMessageRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "stakeHbar" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param stakeHbarParams
 * @param externalAccountparams
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
          ...stakeHbarParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "unstakeHbar" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param externalAccountparams
 */
export const unstakeHbar = async (
  network: string,
  mirrorNodeUrl: string,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'unstakeHbar',
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
 * Invoke the "approveAllowance" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param approveAllowanceParams
 * @param externalAccountparams
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
          ...approveAllowanceParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "deleteAllowance" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param deleteAllowanceParams
 * @param externalAccountparams
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
          ...deleteAllowanceParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "deleteAccount" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param deleteAccountParams
 * @param externalAccountparams
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
          ...deleteAccountParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "createToken" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param createTokenRequestParams
 * @param externalAccountparams
 */
export const createToken = async (
  network: string,
  mirrorNodeUrl: string,
  createTokenRequestParams: CreateTokenRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/createToken',
        params: {
          network,
          mirrorNodeUrl,
          ...createTokenRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "updateToken" method from the snap.
 *
 * @param network
 * @param mirrorNodeUrl
 * @param updateTokenRequestParams
 * @param externalAccountparams
 */
export const updateToken = async (
  network: string,
  mirrorNodeUrl: string,
  updateTokenRequestParams: UpdateTokenRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/updateToken',
        params: {
          network,
          mirrorNodeUrl,
          ...updateTokenRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "updateTokenFeeSchedule" method from the snap.
 *
 * @param network
 * @param mirrorNodeUrl
 * @param updateTokenFeeScheduleRequestParams
 * @param externalAccountparams
 */
export const updateTokenFeeSchedule = async (
  network: string,
  mirrorNodeUrl: string,
  updateTokenFeeScheduleRequestParams: UpdateTokenFeeScheduleRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/updateTokenFeeSchedule',
        params: {
          network,
          mirrorNodeUrl,
          ...updateTokenFeeScheduleRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "mintToken" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param mintTokenRequestParams
 * @param externalAccountparams
 */
export const mintToken = async (
  network: string,
  mirrorNodeUrl: string,
  mintTokenRequestParams: MintTokenRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/mintToken',
        params: {
          network,
          mirrorNodeUrl,
          ...mintTokenRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "burnToken" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param burnTokenRequestParams
 * @param externalAccountparams
 */
export const burnToken = async (
  network: string,
  mirrorNodeUrl: string,
  burnTokenRequestParams: BurnTokenRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/burnToken',
        params: {
          network,
          mirrorNodeUrl,
          ...burnTokenRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "pauseToken" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param pauseTokenRequestParams
 * @param externalAccountparams
 */
export const pauseToken = async (
  network: string,
  mirrorNodeUrl: string,
  pauseTokenRequestParams: PauseOrDeleteTokenRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/pauseToken',
        params: {
          network,
          mirrorNodeUrl,
          ...pauseTokenRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "unpauseToken" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param unpauseTokenRequestParams
 * @param externalAccountparams
 */
export const unpauseToken = async (
  network: string,
  mirrorNodeUrl: string,
  unpauseTokenRequestParams: PauseOrDeleteTokenRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/unpauseToken',
        params: {
          network,
          mirrorNodeUrl,
          ...unpauseTokenRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "associateTokens" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param associateTokensRequestParams
 * @param externalAccountparams
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
          ...associateTokensRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "dissociateTokens" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param dissociateTokensRequestParams
 * @param externalAccountparams
 */
export const dissociateTokens = async (
  network: string,
  mirrorNodeUrl: string,
  dissociateTokensRequestParams: DissociateTokensRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/dissociateTokens',
        params: {
          network,
          mirrorNodeUrl,
          ...dissociateTokensRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "deleteToken" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param deleteTokenRequestParams
 * @param externalAccountparams
 */
export const deleteToken = async (
  network: string,
  mirrorNodeUrl: string,
  deleteTokenRequestParams: PauseOrDeleteTokenRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/deleteToken',
        params: {
          network,
          mirrorNodeUrl,
          ...deleteTokenRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "freezeAccount" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param freezeAccountRequestParams
 * @param externalAccountparams
 */
export const freezeAccount = async (
  network: string,
  mirrorNodeUrl: string,
  freezeAccountRequestParams: FreezeOrEnableKYCAccountRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/freezeAccount',
        params: {
          network,
          mirrorNodeUrl,
          ...freezeAccountRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "unfreezeAccount" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param unfreezeAccountRequestParams
 * @param externalAccountparams
 */
export const unfreezeAccount = async (
  network: string,
  mirrorNodeUrl: string,
  unfreezeAccountRequestParams: FreezeOrEnableKYCAccountRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/unfreezeAccount',
        params: {
          network,
          mirrorNodeUrl,
          ...unfreezeAccountRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "enableKYCAccount" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param enableKYCAccountRequestParams
 * @param externalAccountparams
 */
export const enableKYCAccount = async (
  network: string,
  mirrorNodeUrl: string,
  enableKYCAccountRequestParams: FreezeOrEnableKYCAccountRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/enableKYCFlag',
        params: {
          network,
          mirrorNodeUrl,
          ...enableKYCAccountRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "disableKYCAccount" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param disableKYCAccountRequestParams
 * @param externalAccountparams
 */
export const disableKYCAccount = async (
  network: string,
  mirrorNodeUrl: string,
  disableKYCAccountRequestParams: FreezeOrEnableKYCAccountRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/disableKYCFlag',
        params: {
          network,
          mirrorNodeUrl,
          ...disableKYCAccountRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "wipeToken" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param wipeTokenRequestParams
 * @param externalAccountparams
 */
export const wipeToken = async (
  network: string,
  mirrorNodeUrl: string,
  wipeTokenRequestParams: WipeTokenRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/wipeToken',
        params: {
          network,
          mirrorNodeUrl,
          ...wipeTokenRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "showAccountPrivateKey" method from the snap.
 *
 * @param network
 * @param mirrorNodeUrl
 * @param externalAccountparams
 */
export const showAccountPrivateKey = async (
  network: string,
  mirrorNodeUrl: string,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'showAccountPrivateKey',
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
 * Invoke the "initiateSwap" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param initiateSwapRequestParams
 * @param externalAccountparams
 */
export const initiateSwap = async (
  network: string,
  mirrorNodeUrl: string,
  initiateSwapRequestParams: InitiateSwapRequestParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/initiateSwap',
        params: {
          network,
          mirrorNodeUrl,
          ...initiateSwapRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

/**
 * Invoke the "completeSwap" method from the snap.
 * @param network
 * @param mirrorNodeUrl
 * @param atomicSwapCompleteParams
 * @param externalAccountparams
 */
export const completeSwap = async (
  network: string,
  mirrorNodeUrl: string,
  completeSwapRequestParams: SignScheduledTxParams,
  externalAccountparams?: ExternalAccountParams,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hts/completeSwap',
        params: {
          network,
          mirrorNodeUrl,
          ...completeSwapRequestParams,
          ...externalAccountparams,
        },
      },
    },
  });
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');
