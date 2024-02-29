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
  PublicKey,
} from '@hashgraph/sdk';

import { AccountInfo } from '../types/account';
import { SimpleHederaClient } from '../types/hedera';
import { HederaAccountStrategy } from './strategies/HederaAccountStrategy';

export class SimpleHederaClientImpl implements SimpleHederaClient {
  // eslint-disable-next-line no-restricted-syntax
  readonly #client: Client;

  // eslint-disable-next-line no-restricted-syntax
  readonly #privateKey: PrivateKey | null;

  constructor(client: Client, privateKey: PrivateKey | null) {
    this.#client = client;
    this.#privateKey = privateKey;
  }

  close() {
    this.#client.close();
  }

  getClient(): Client {
    return this.#client;
  }

  getPrivateKey(): PrivateKey | null {
    return this.#privateKey;
  }

  getPublicKey(): PublicKey {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    return this.#client.operatorPublicKey!;
  }

  getAccountId(): AccountId {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    return this.#client.operatorAccountId!;
  }

  async getAccountInfo(accountId: string): Promise<AccountInfo> {
    return HederaAccountStrategy.getAccountInfo(this.#client, accountId);
  }

  async getAccountBalance(): Promise<number> {
    return await HederaAccountStrategy.getAccountBalance(this.#client);
  }
}
