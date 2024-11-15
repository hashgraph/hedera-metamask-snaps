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
  AccountBalanceQuery,
  AccountInfoQuery,
  Hbar,
  HbarUnit,
  PublicKey,
  type AccountId,
  type Client,
} from '@hashgraph/sdk';
import type {
  AccountInfoJson,
  StakingInfoJson,
} from '@hashgraph/sdk/lib/account/AccountInfo';
import type { HederaAccountInfo } from '../types/account';
import { Utils } from '../utils/Utils';

export class HederaAccountStrategy {
  public static async getAccountInfo(
    client: Client,
    accountId: string,
  ): Promise<HederaAccountInfo> {
    const query = new AccountInfoQuery({ accountId });
    await query.getCost(client);

    const accountInfo = await query.execute(client);
    const accountInfoJson: AccountInfoJson = accountInfo.toJSON();

    const hbarBalance = Number(accountInfoJson.balance.replace(' ℏ', ''));
    const stakingInfo = {} as StakingInfoJson;
    if (accountInfoJson.stakingInfo) {
      stakingInfo.declineStakingReward =
        accountInfoJson.stakingInfo.declineStakingReward;

      stakingInfo.stakePeriodStart = Utils.timestampToString(
        accountInfoJson.stakingInfo.stakePeriodStart,
      );

      stakingInfo.pendingReward = Hbar.fromString(
        accountInfoJson.stakingInfo.pendingReward ?? '0',
      )
        .toString(HbarUnit.Hbar)
        .replace(' ℏ', '');
      stakingInfo.stakedToMe = Hbar.fromString(
        accountInfoJson.stakingInfo.stakedToMe ?? '0',
      )
        .toString(HbarUnit.Hbar)
        .replace(' ℏ', '');
      stakingInfo.stakedAccountId =
        accountInfoJson.stakingInfo.stakedAccountId ?? '';
      stakingInfo.stakedNodeId = accountInfoJson.stakingInfo.stakedNodeId ?? '';
    }

    return {
      accountId: accountInfoJson.accountId,
      evmAddress: accountInfoJson.contractAccountId
        ? `0x${accountInfoJson.contractAccountId}`
        : '',
      key: {
        key: accountInfoJson.key
          ? PublicKey.fromString(accountInfoJson.key).toStringRaw()
          : '',
      },
    } as HederaAccountInfo;
  }

  public static async getAccountBalance(client: Client): Promise<number> {
    const query = new AccountBalanceQuery().setAccountId(
      client.operatorAccountId as AccountId,
    );

    // Submit the query to a Hedera network
    const accountBalance = await query.execute(client);

    const amount = accountBalance.hbars.to(HbarUnit.Hbar);
    return amount.toNumber();
  }
}
