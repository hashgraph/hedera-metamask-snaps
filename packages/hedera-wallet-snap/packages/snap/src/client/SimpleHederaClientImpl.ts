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
  AccountAllowanceApproveTransaction,
  AccountAllowanceDeleteTransaction,
  AccountBalanceQuery,
  AccountDeleteTransaction,
  type AccountId,
  AccountInfoQuery,
  AccountUpdateTransaction,
  type Client,
  CustomFixedFee,
  Hbar,
  HbarUnit,
  NftId,
  type PrivateKey,
  PublicKey,
  TokenAssociateTransaction,
  TokenCreateTransaction,
  TokenSupplyType,
  TokenType,
  TransferTransaction,
} from '@hashgraph/sdk';

import { AccountInfo } from '../types/account';
import { SimpleHederaClient, SimpleTransfer, TxReceipt } from '../types/hedera';
import { ApproveAllowanceAssetDetail, TokenCustomFee } from '../types/params';
import { Utils } from '../utils/Utils';
import { CryptoUtils } from '../utils/CryptoUtils';
import {
  AccountInfoJson,
  StakingInfoJson,
} from '@hashgraph/sdk/lib/account/AccountInfo';
import _ from 'lodash';
import { ethers } from 'ethers';

export class SimpleHederaClientImpl implements SimpleHederaClient {
  // eslint-disable-next-line no-restricted-syntax
  private readonly _client: Client;

  // eslint-disable-next-line no-restricted-syntax
  private readonly _privateKey: PrivateKey | null;

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
    return this.#getAccountInfo(this._client, accountId);
  }

  async getAccountBalance(): Promise<number> {
    return this.#getAccountBalance(this._client);
  }

  async #getAccountBalance(client: Client): Promise<number> {
    // Create the account balance query
    const query = new AccountBalanceQuery().setAccountId(
      client.operatorAccountId as AccountId,
    );

    // Submit the query to a Hedera network
    const accountBalance = await query.execute(client);

    const amount = accountBalance.hbars.to(HbarUnit.Hbar);
    return amount.toNumber();
  }

  async #getAccountInfo(
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
