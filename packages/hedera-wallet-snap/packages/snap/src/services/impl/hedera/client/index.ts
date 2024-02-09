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
  type AccountId,
  type Client,
  type PrivateKey,
  type PublicKey,
} from '@hashgraph/sdk';

import { AccountInfo } from '../../../../types/account';
import { ApproveAllowanceAssetDetail } from '../../../../types/params';
import {
  SimpleHederaClient,
  SimpleTransfer,
  TxReceipt,
} from '../../../../types/hedera';
import { approveAllowance } from './approveAllowance';
import { deleteAccount } from './deleteAccount';
import { deleteAllowance } from './deleteAllowance';
import { getAccountBalance } from './getAccountBalance';
import { getAccountInfo } from './getAccountInfo';
import { associateTokens } from './hts/associateTokens';
import { stakeHbar } from './stakeHbar';
import { transferCrypto } from './transferCrypto';

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
    return getAccountInfo(this._client, accountId);
  }

  async getAccountBalance(): Promise<number> {
    return getAccountBalance(this._client);
  }

  async associateTokens(options: { tokenIds: string[] }): Promise<TxReceipt> {
    return associateTokens(this._client, options);
  }

  async transferCrypto(options: {
    transfers: SimpleTransfer[];
    memo: string | null;
    maxFee: number | null;
    serviceFeesToPay: Record<string, number>;
    serviceFeeToAddress: string | null;
    onBeforeConfirm?: () => void;
  }): Promise<TxReceipt> {
    return transferCrypto(this._client, options);
  }

  async stakeHbar(options: {
    nodeId: number | null;
    accountId: string | null;
  }): Promise<TxReceipt> {
    return stakeHbar(this._client, options);
  }

  async approveAllowance(options: {
    spenderAccountId: string;
    amount: number;
    assetType: string;
    assetDetail?: ApproveAllowanceAssetDetail;
  }): Promise<TxReceipt> {
    return approveAllowance(this._client, options);
  }

  async deleteAllowance(options: {
    assetType: string;
    assetId: string;
    spenderAccountId?: string;
  }): Promise<TxReceipt> {
    return deleteAllowance(this._client, options);
  }

  async deleteAccount(options: {
    transferAccountId: string;
  }): Promise<TxReceipt> {
    return deleteAccount(this._client, options);
  }
}
