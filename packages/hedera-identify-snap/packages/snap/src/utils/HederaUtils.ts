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

import _ from 'lodash';
import { hederaChainIDs, otherChainIDs } from '../config/network';
import type { HederaAccountInfo } from '../types/account';
import {
  DEFAULTHEDERAMIRRORNODES,
  hederaNetworks,
  isIn,
} from '../types/constants';
import type {
  HederaNetworkInfo,
  MirrorAccountInfo,
  MirrorTransactionInfo,
} from '../types/hedera';
import { FetchUtils, type FetchResponse } from './FetchUtils';
import { Utils } from './Utils';

export class HederaUtils {
  /**
   * Check Validation of network flag and mirrorNodeUrl flag and return their values.
   * @param params - Request params.
   * @returns Network and MirrorNodeUrl.
   */
  public static getHederaNetworkInfo(chainId: string): HederaNetworkInfo {
    const networkInfo = {
      hederaNetwork: 'mainnet',
      mirrorNodeUrl: DEFAULTHEDERAMIRRORNODES.mainnet,
    } as HederaNetworkInfo;

    networkInfo.hederaNetwork = hederaChainIDs[chainId] || 'mainnet';
    networkInfo.mirrorNodeUrl =
      DEFAULTHEDERAMIRRORNODES[networkInfo.hederaNetwork];

    return networkInfo;
  }

  public static getOtherNetwork = (chainId: string): string => {
    const network = otherChainIDs[chainId];
    return network || `Unknown Network (Chain ID: ${chainId})`;
  };

  public static validHederaNetwork(network: string) {
    return isIn(hederaNetworks, network);
  }

  public static async getMirrorTransactions(
    accountId: string,
    transactionId: string,
    mirrorNodeUrl: string,
  ): Promise<MirrorTransactionInfo[]> {
    let result = [] as MirrorTransactionInfo[];
    let url = `${mirrorNodeUrl}/api/v1/transactions/`;
    if (_.isEmpty(transactionId)) {
      url = `${url}?account.id=${encodeURIComponent(accountId)}&limit=50&order=desc`;
    } else {
      url = `${url}${encodeURIComponent(transactionId)}`;
    }

    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (!response.success) {
      return result;
    }

    try {
      result = response.data.transactions as MirrorTransactionInfo[];

      result.forEach((transaction) => {
        transaction.consensus_timestamp = Utils.timestampToString(
          transaction.consensus_timestamp,
        );
        transaction.parent_consensus_timestamp = Utils.timestampToString(
          transaction.parent_consensus_timestamp,
        );
        transaction.valid_start_timestamp = Utils.timestampToString(
          transaction.valid_start_timestamp,
        );
      });
    } catch (error: any) {
      console.error('Error in getMirrorTransactions:', String(error));
    }

    return result;
  }

  public static async getMirrorAccountInfo(
    idOrAliasOrEvmAddress: string,
    mirrorNodeUrl: string,
  ): Promise<HederaAccountInfo> {
    const result = {} as HederaAccountInfo;
    const url = `${mirrorNodeUrl}/api/v1/accounts/${encodeURIComponent(idOrAliasOrEvmAddress)}`;
    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (!response.success) {
      return result;
    }

    const mirrorNodeData = response.data as MirrorAccountInfo;

    try {
      result.accountId = mirrorNodeData.account;
      result.evmAddress = mirrorNodeData.evm_address;
      result.key = {
        type: mirrorNodeData?.key?._type ?? '',
        key: mirrorNodeData?.key?.key ?? '',
      };
    } catch (error: any) {
      console.error('Error in getMirrorAccountInfo:', String(error));
    }

    return result;
  }
}
