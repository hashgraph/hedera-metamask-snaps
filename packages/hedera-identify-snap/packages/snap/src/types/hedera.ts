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
import type { Long } from '@hashgraph/sdk/lib/long';

import type { HederaAccountInfo } from './account';

export type HederaNetworkInfo = {
  hederaNetwork: string;
  mirrorNodeUrl: string;
};

export type HederaService = {
  getMirrorAccountInfo(
    idOrAliasOrEvmAddress: string,
  ): Promise<HederaAccountInfo>;
};

export type SimpleHederaClient = {
  // close the client
  close(): void;

  // get the associated client
  getClient(): Client;

  // get the associated private key, if available
  getPrivateKey(): PrivateKey | null;

  // get the associated public key
  getPublicKey(): PublicKey;

  // get the associated account ID
  getAccountId(): AccountId;
};

export type MirrorAccountInfo = {
  account: string;
  alias: string;
  auto_renew_period: Long;
  balance: {
    balance: number;
    timestamp: string;
    tokens: [];
  };
  created_timestamp: string;
  decline_reward: boolean;
  deleted: boolean;
  ethereum_nonce: Long;
  evm_address: string;
  expiry_timestamp: string;
  key: {
    _type: string;
    key: string;
  };
  max_automatic_token_associations: Long;
  memo: string;
  pending_reward: Long;
  receiver_sig_required: boolean;
  staked_account_id?: string;
  staked_node_id?: number;
  stake_period_start?: string;
  transactions: [];
  links: {
    next: string;
  };
};
