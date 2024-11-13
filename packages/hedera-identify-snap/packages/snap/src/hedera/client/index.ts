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
  AccountId,
  AccountInfoQuery,
  Client,
  Hbar,
  HbarUnit,
  PrivateKey,
  PublicKey,
} from '@hashgraph/sdk';

import {
  AccountInfoJson,
  StakingInfoJson,
} from '@hashgraph/sdk/lib/account/AccountInfo';
import { AccountInfo } from '../../types/hedera';
import { Utils } from '../../utils/utils';
import { SimpleHederaClient } from '../service';

export class SimpleHederaClientImpl implements SimpleHederaClient {
  private _client: Client;

  private _privateKey: PrivateKey | null;

  constructor(client: Client, privateKey: PrivateKey | null) {
    this._client = client;
    this._privateKey = privateKey;
  }

  close() {
    this._client.close();
  }

  getClient(): Client {
    return this._client;
  }

  getPrivateKey(): PrivateKey | null {
    return this._privateKey;
  }

  getPublicKey(): PublicKey {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    return this._client.operatorPublicKey!;
  }

  getAccountId(): AccountId {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    return this._client.operatorAccountId!;
  }

  async getAccountInfo(accountId: string): Promise<AccountInfo> {
    const query = new AccountInfoQuery({ accountId });
    await query.getCost(this._client);

    const accountInfo = await query.execute(this._client);
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
      alias: accountInfoJson.aliasKey ?? '',
      expirationTime: Utils.timestampToString(accountInfoJson.expirationTime),
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
        timestamp: Utils.timestampToString(new Date()),
      },
      autoRenewPeriod: accountInfo.autoRenewPeriod.seconds.toString(),
      ethereumNonce: accountInfoJson.ethereumNonce ?? '',
      isDeleted: accountInfoJson.isDeleted,
      stakingInfo,
    } as AccountInfo;
  }
}
