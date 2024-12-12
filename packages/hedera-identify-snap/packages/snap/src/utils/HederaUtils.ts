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

import {
  DEFAULT_HEDERA_MIRRORNODES,
  HEDERA_CHAIN_IDS,
  HEDERA_NETWORKS,
} from '../constants/network';
import type { HederaAccountInfo } from '../types/account';
import { isIn } from '../types/constants';
import type { HederaNetworkInfo, MirrorAccountInfo } from '../types/hedera';
import { FetchUtils, type FetchResponse } from './FetchUtils';

export class HederaUtils {
  /**
   * Check Validation of network flag and mirrorNodeUrl flag and return their values.
   * @param params - Request params.
   * @returns Network and MirrorNodeUrl.
   */
  public static getHederaNetworkInfo(chainId: string): HederaNetworkInfo {
    const networkInfo = {
      hederaNetwork: 'mainnet',
      mirrorNodeUrl: DEFAULT_HEDERA_MIRRORNODES.mainnet,
    } as HederaNetworkInfo;

    networkInfo.hederaNetwork = HEDERA_CHAIN_IDS[chainId] || 'mainnet';
    networkInfo.mirrorNodeUrl =
      DEFAULT_HEDERA_MIRRORNODES[networkInfo.hederaNetwork];

    return networkInfo;
  }

  public static validHederaNetwork(network: string) {
    return isIn(HEDERA_NETWORKS, network);
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
