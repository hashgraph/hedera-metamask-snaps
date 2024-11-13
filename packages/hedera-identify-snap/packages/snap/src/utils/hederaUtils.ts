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

import { NftId, TokenId } from '@hashgraph/sdk';
import type { StakingInfoJson } from '@hashgraph/sdk/lib/StakingInfo';
import {
  DEFAULTHEDERAMIRRORNODES,
  hederaChainIDs,
  otherChainIDs,
} from '../hedera/config';
import { isIn } from '../types/constants';
import type {
  AccountBalance,
  AccountInfo,
  MirrorAccountInfo,
  MirrorNftInfo,
  MirrorTokenInfo,
  NetworkInfo,
  Token,
  TokenBalance,
} from '../types/hedera';
import { CryptoUtils } from './cryptoUtils';
import { FetchResponse, FetchUtils } from './fetchUtils';
import { Utils } from './utils';

export class HederaUtils {
  /**
   * Check Validation of network flag and mirrorNodeUrl flag and return their values.
   * @param params - Request params.
   * @returns Network and MirrorNodeUrl.
   */
  public static getHederaNetworkInfo(chainId: string): NetworkInfo {
    const networkInfo = {
      network: 'mainnet',
      mirrorNodeUrl: DEFAULTHEDERAMIRRORNODES.mainnet,
    } as NetworkInfo;

    networkInfo.network = hederaChainIDs[chainId] || 'mainnet';
    networkInfo.mirrorNodeUrl = DEFAULTHEDERAMIRRORNODES[networkInfo.network];

    return networkInfo;
  }

  public static getOtherNetwork = (chainId: string): string => {
    const network = otherChainIDs[chainId];
    return network || `Unknown Network (Chain ID: ${chainId})`;
  };

  public static validHederaChainID = (x: string) => {
    return isIn(Object.keys(hederaChainIDs) as string[], x);
  };

  public static async getMirrorAccountInfo(
    idOrAliasOrEvmAddress: string,
    mirrorNodeUrl: string,
  ): Promise<AccountInfo> {
    const result = {} as AccountInfo;
    const url = `${mirrorNodeUrl}/api/v1/accounts/${encodeURIComponent(idOrAliasOrEvmAddress)}`;
    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (!response.success) {
      return result;
    }

    const mirrorNodeData = response.data as MirrorAccountInfo;

    try {
      result.accountId = mirrorNodeData.account;
      result.alias = mirrorNodeData.alias;
      result.createdTime = Utils.timestampToString(
        mirrorNodeData.created_timestamp,
      );
      result.expirationTime = Utils.timestampToString(
        mirrorNodeData.expiry_timestamp,
      );
      result.memo = mirrorNodeData.memo;
      result.evmAddress = mirrorNodeData.evm_address;
      result.key = {
        type: mirrorNodeData?.key?._type ?? '',
        key: mirrorNodeData?.key?.key ?? '',
      };
      result.autoRenewPeriod = String(mirrorNodeData.auto_renew_period);
      result.ethereumNonce = String(mirrorNodeData.ethereum_nonce);
      result.isDeleted = mirrorNodeData.deleted;
      result.stakingInfo = {
        declineStakingReward: mirrorNodeData.decline_reward,
        stakePeriodStart: Utils.timestampToString(
          mirrorNodeData.stake_period_start,
        ),
        pendingReward: String(mirrorNodeData.pending_reward),
        stakedToMe: '0', // TODO
        stakedAccountId: mirrorNodeData.staked_account_id ?? '',
        stakedNodeId: mirrorNodeData.staked_node_id ?? '',
      } as StakingInfoJson;

      const hbars = mirrorNodeData.balance.balance / 1e8;
      const tokens: Record<string, TokenBalance> = {};
      // Use map to create an array of promises
      const tokenPromises = mirrorNodeData.balance.tokens.map(
        async (token: Token) => {
          const tokenId = token.token_id;
          const tokenInfo: MirrorTokenInfo = await CryptoUtils.getTokenById(
            tokenId,
            mirrorNodeUrl,
          );
          if (tokenInfo.type === 'NON_FUNGIBLE_UNIQUE') {
            const nfts: MirrorNftInfo[] = await CryptoUtils.getNftSerialNumber(
              tokenId,
              result.accountId,
              mirrorNodeUrl,
            );
            nfts.forEach((nftInfo) => {
              const nftId = new NftId(
                TokenId.fromString(tokenId),
                Number(nftInfo.serial_number),
              );
              tokens[nftId.toString()] = {
                balance: 1,
                decimals: 0,
                tokenId,
                nftSerialNumber: nftInfo.serial_number,
                name: tokenInfo.name,
                symbol: tokenInfo.symbol,
                tokenType: tokenInfo.type,
                supplyType: tokenInfo.supply_type,
                totalSupply: (
                  Number(tokenInfo.total_supply) /
                  Math.pow(10, Number(tokenInfo.decimals))
                ).toString(),
                maxSupply: (
                  Number(tokenInfo.max_supply) /
                  Math.pow(10, Number(tokenInfo.decimals))
                ).toString(),
              } as TokenBalance;
            });
          } else {
            tokens[tokenId] = {
              balance: token.balance / Math.pow(10, Number(tokenInfo.decimals)),
              decimals: Number(tokenInfo.decimals),
              tokenId,
              name: tokenInfo.name,
              symbol: tokenInfo.symbol,
              tokenType: tokenInfo.type,
              supplyType: tokenInfo.supply_type,
              totalSupply: (
                Number(tokenInfo.total_supply) /
                Math.pow(10, Number(tokenInfo.decimals))
              ).toString(),
              maxSupply: (
                Number(tokenInfo.max_supply) /
                Math.pow(10, Number(tokenInfo.decimals))
              ).toString(),
            } as TokenBalance;
          }
        },
      );

      // Wait for all promises to resolve
      await Promise.all(tokenPromises);

      result.balance = {
        hbars,
        timestamp: Utils.timestampToString(mirrorNodeData.balance.timestamp),
        tokens,
      } as AccountBalance;
    } catch (error: any) {
      console.error('Error in getMirrorAccountInfo:', String(error));
    }

    return result;
  }
}
