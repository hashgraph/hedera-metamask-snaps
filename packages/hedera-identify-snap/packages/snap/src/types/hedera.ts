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

import type { CustomFee, Key, Long, Timestamp } from '@hashgraph/sdk';
import type { StakingInfoJson } from '@hashgraph/sdk/lib/account/AccountInfo';

export type NetworkInfo = {
  network: string;
  mirrorNodeUrl: string;
};

export type Token = {
  token_id: string;
  balance: number;
};

export type TokenBalance = {
  balance: number;
  decimals: number;
  tokenId: string;
  nftSerialNumber: string;
  name: string;
  symbol: string;
  tokenType: string;
  supplyType: string;
  totalSupply: string;
  maxSupply: string;
};

export type AccountBalance = {
  // balance here in hbars
  hbars: number;
  timestamp: string;
  tokens: Record<string, TokenBalance>;
};

export type AccountInfo = {
  accountId: string;
  alias: string;
  createdTime: string;
  expirationTime: string;
  memo: string;
  evmAddress: string;
  key: {
    type: string;
    key: string;
  };
  balance: AccountBalance;
  autoRenewPeriod: string;
  ethereumNonce: string;
  isDeleted: boolean;
  stakingInfo: StakingInfoJson;
};

export type MirrorTokenInfo = {
  admin_key: Key;
  auto_renew_account: string;
  auto_renew_period: number;
  created_timestamp: Timestamp;
  custom_fees: CustomFee;
  decimals: string;
  deleted: boolean;
  expiry_timestamp: string;
  fee_schedule_key: Key;
  freeze_default: boolean;
  initial_supply: string;
  max_supply: string;
  memo: string;
  modified_timestamp: Timestamp;
  name: string;
  pause_key: Key;
  pause_status: string;
  supply_key: Key;
  supply_type: string;
  symbol: string;
  token_id: string;
  total_supply: string;
  treasury_account_id: string;
  type: string;
  wipe_key: Key;
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

export type MirrorNftInfo = {
  account_id: string;
  created_timestamp: string;
  deleted: boolean;
  metadata: string;
  modified_timestamp: string;
  serial_number: string;
  token_id: string;
};
