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

import type {
  AccountId,
  Hbar,
  HbarAllowance,
  Key,
  LedgerId,
  LiveHash,
  PublicKey,
  Timestamp,
  TokenAllowance,
  TokenNftAllowance,
} from '@hashgraph/sdk';
import TokenRelationshipMap from '@hashgraph/sdk/lib/account/TokenRelationshipMap';
import Duration from '@hashgraph/sdk/lib/Duration';
import StakingInfo from '@hashgraph/sdk/lib/StakingInfo';
import Long from 'long';

/* eslint-disable*/

export type HederaMirrorInfo = {
  account: string;
  evmAddress: string;
  publicKey?: string;
  alias: string;
  balance: number;
  createdDate: string;
  expiryDate: string;
  memo: string;
  newlyCreated?: boolean;
};

export type HederaAccountInfo = {
  accountId: AccountId;
  contractAccountId?: string;
  isDeleted: boolean;
  proxyAccountId?: object;
  proxyReceived: Hbar;
  key: Key;
  balance: Hbar;
  sendRecordThreshold: Hbar;
  receiveRecordThreshold: Hbar;
  isReceiverSignatureRequired: boolean;
  expirationTime: Timestamp;
  autoRenewPeriod: Duration;
  liveHashes: LiveHash[];
  tokenRelationships: TokenRelationshipMap;
  accountMemo: string;
  ownedNfts: Long;
  maxAutomaticTokenAssociations: Long;
  aliasKey: PublicKey;
  ledgerId: LedgerId;
  hbarAllowances: HbarAllowance[];
  tokenAllowances: TokenAllowance[];
  nftAllowances: TokenNftAllowance[];
  ethereumNonce?: Long;
  stakingInfo?: StakingInfo;
};
