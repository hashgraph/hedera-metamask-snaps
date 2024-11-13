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

import type { AccountId, Client, PrivateKey, PublicKey } from '@hashgraph/sdk';

import { Wallet } from './wallet/abstract';

import Long from 'long';
import * as protobuf from 'protobufjs';
import { AccountInfo } from 'src/types/hedera';

// Ensure that protobuf uses Long for 64-bit integers
protobuf.util.Long = Long;
protobuf.configure();

export type HederaClientFactory = {
  // returns null if the account ID does not match the chosen key
  createClient(options: {
    wallet: Wallet;
    // index into the wallet, meaning depends on the wallet type
    // 0 always means the canonical key for the wallet
    keyIndex: number;
    // account ID we wish to associate with the wallet
    accountId: string;
    network: string;
  }): Promise<SimpleHederaClient | null>;
};

export type SimpleHederaClient = {
  getClient(): Client;

  // get the associated private key, if available
  getPrivateKey(): PrivateKey | null;

  // get the associated public key
  getPublicKey(): PublicKey;

  // get the associated account ID
  getAccountId(): AccountId;

  getAccountInfo(accountId: string): Promise<AccountInfo>;
};
