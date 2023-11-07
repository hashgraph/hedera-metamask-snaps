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
  Hbar,
  type AccountId,
  type Client,
  type PrivateKey,
  type PublicKey,
} from '@hashgraph/sdk';

import { AccountInfo } from '../../../../types/account';
import {
  AccountBalance,
  SimpleHederaClient,
  SimpleTransfer,
  TxReceipt,
} from '../../../hedera';
import { getAccountBalance } from './getAccountBalance';
import { getAccountInfo } from './getAccountInfo';
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

  setMaxQueryPayment(cost: any): void {
    const costInHbar = new Hbar(cost);
    // this sets the fee paid by the client for the query
    this._client.setMaxQueryPayment(costInHbar);
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

  async transferCrypto(options: {
    currentBalance: AccountBalance;
    transfers: SimpleTransfer[];
    memo: string | null;
    maxFee: number | null;
    serviceFeesToPay: Record<string, number> | null;
    serviceFeeToAddress: string | null;
    onBeforeConfirm?: () => void;
  }): Promise<TxReceipt> {
    return transferCrypto(this._client, options);
  }
}
