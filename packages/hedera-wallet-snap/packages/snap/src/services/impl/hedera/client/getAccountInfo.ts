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

import {
  AccountInfoQuery,
  Hbar,
  HbarUnit,
  PublicKey,
  type Client,
} from '@hashgraph/sdk';
import {
  AccountInfoJson,
  StakingInfoJson,
} from '@hashgraph/sdk/lib/account/AccountInfo';
import { AccountInfo } from '../../../../types/account';

/**
 * Retrieve the account info.
 *
 * @param client - Hedera client.
 * @param accountId - Hedera Account Id to retrieve account info for.
 */
export async function getAccountInfo(
  client: Client,
  accountId: string,
): Promise<AccountInfo> {
  // Create the account info query
  const query = new AccountInfoQuery({ accountId });
  await query.getCost(client);

  const accountInfo = await query.execute(client);
  const accountInfoJson: AccountInfoJson = accountInfo.toJSON();

  const hbarBalance = Number(accountInfoJson.balance.replace(' ℏ', ''));
  const stakingInfo = {} as StakingInfoJson;
  if (accountInfoJson.stakingInfo) {
    stakingInfo.declineStakingReward =
      accountInfoJson.stakingInfo.declineStakingReward;

    stakingInfo.stakePeriodStart = accountInfoJson.stakingInfo.stakePeriodStart
      ? new Date(
          parseFloat(accountInfoJson.stakingInfo.stakePeriodStart) * 1000,
        ).toISOString()
      : '';

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
    alias: accountInfoJson.aliasKey ?? '',
    expirationTime: new Date(
      parseFloat(accountInfoJson.expirationTime) * 1000,
    ).toISOString(),
    memo: accountInfoJson.accountMemo,
    evmAddress: accountInfoJson.contractAccountId
      ? `0x${accountInfoJson.contractAccountId}`
      : '',
    key: {
      key: accountInfoJson.key
        ? PublicKey.fromString(accountInfoJson.key).toStringRaw()
        : '',
    },
    balance: {
      hbars: hbarBalance,
      timestamp: new Date().toISOString(),
    },
    autoRenewPeriod: accountInfo.autoRenewPeriod.seconds.toString(),
    ethereumNonce: accountInfoJson.ethereumNonce ?? '',
    isDeleted: accountInfoJson.isDeleted,
    stakingInfo,
  } as AccountInfo;
}
