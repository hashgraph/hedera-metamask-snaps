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

import type {
  AccountId,
  Client,
  CustomFee,
  Key,
  PrivateKey,
  PublicKey,
  Timestamp,
} from '@hashgraph/sdk';
import { Long } from '@hashgraph/sdk/lib/long';
import { BigNumber } from 'bignumber.js';

import { Wallet } from '../domain/wallet/abstract';
import { AccountInfo } from '../types/account';

export type SimpleTransfer = {
  // HBAR or Token ID (as string)
  asset: string;
  to: string;
  // amount must be in low denom
  amount: number;
};

export type Token = {
  token_id: string;
  balance: number;
};

export type TokenBalance = {
  balance: number;
  decimals: number;
  tokenId: string;
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

export type TxRecordTransfer = {
  accountId: string;
  amount: string;
  isApproved: boolean;
};

export type TxReceiptExchangeRate = {
  hbars: number;
  cents: number;
  expirationTime: string;
  exchangeRateInCents: number;
};

export type TxReceipt = {
  status: string;
  accountId: string;
  fileId: string;
  contractId: string;
  topicId: string;
  tokenId: string;
  scheduleId: string;
  exchangeRate: TxReceiptExchangeRate;
  topicSequenceNumber: string;
  topicRunningHash: string;
  totalSupply: string;
  scheduledTransactionId: string;
  serials: object;
  duplicates: object;
  children: object;
};

export type TxRecord = {
  receipt: object;
  transactionHash: string;
  consensusTimestamp: string;
  transactionId: string;
  transactionMemo: string;
  transactionFee: string;
  transfers: TxRecordTransfer[];
  contractFunctionResult: object | null;
  tokenTransfers: object;
  tokenTransfersList: object;
  scheduleRef: string;
  assessedCustomFees: object;
  nftTransfers: object;
  automaticTokenAssociations: object;
  parentConsensusTimestamp: string;
  aliasKey: string;
  duplicates: object;
  children: object;
  ethereumHash: string;
  paidStakingRewards: TxRecordTransfer[];
  prngBytes: string;
  prngNumber: string;
  evmAddress: string;
};

export type HederaService = {
  // returns null if the account ID does not match the chosen key
  createClient(options: {
    wallet: Wallet;
    // index into the wallet, meaning depends on the wallet type
    // 0 always means the canonical key for the wallet
    keyIndex: number;
    // account ID we wish to associate with the wallet
    accountId: AccountId;
  }): Promise<SimpleHederaClient | null>;

  getNodeStakingInfo(): Promise<MirrorStakingInfo[]>;

  getMirrorAccountInfo(idOrAliasOrEvmAddress: string): Promise<AccountInfo>;

  getTokenById(tokenId: string): Promise<MirrorTokenInfo>;

  getMirrorTransactions(
    accountId: string,
    transactionId: string,
  ): Promise<MirrorTransactionInfo[]>;
};

export type SimpleHederaClient = {
  // get the associated client
  getClient(): Client;

  // get the associated private key, if available
  getPrivateKey(): PrivateKey | null;

  // get the associated public key
  getPublicKey(): PublicKey;

  // get the associated account ID
  getAccountId(): AccountId;

  getAccountInfo(accountId: string): Promise<AccountInfo>;

  // returns the account balance in HBARs
  getAccountBalance(): Promise<number>;

  transferCrypto(options: {
    currentBalance: AccountBalance;
    transfers: SimpleTransfer[];
    memo: string | null;
    maxFee: number | null; // hbars
    serviceFeesToPay: Record<string, number>;
    serviceFeeToAddress: string | null;
    onBeforeConfirm?: () => void;
  }): Promise<TxReceipt>;

  stakeHbar(options: {
    nodeId: number | null;
    accountId: string | null;
  }): Promise<TxReceipt>;

  deleteAccount(options: { transferAccountId: string }): Promise<TxReceipt>;
};

export type MirrorStakingInfoServiceEndpoint = {
  ip_address_v4: string;
  port: number;
};

export type MirrorStakingInfo = {
  description: string;
  file_id: string;
  max_stake: BigNumber;
  memo: string;
  min_stake: BigNumber;
  node_id: number;
  node_account_id: string;
  node_cert_hash: string;
  public_key: string;
  reward_rate_start: BigNumber;
  service_endpoints: MirrorStakingInfoServiceEndpoint[];
  stake: BigNumber;
  stake_rewarded: BigNumber;
  stake_not_rewarded: BigNumber;
  // staking period uses strings representing seconds.nanos since the epoch
  staking_period: {
    from: string;
    to: string;
  };
  timestamp: {
    from: string;
    to: string;
  };
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
  type: string;
  wipe_key: Key;
};

export type MirrorTransactionInfoTransfer = {
  account: string;
  amount: number;
  is_approval: boolean;
};

export type MirrorTransactionInfoStakingRewardTransfer = {
  account: string;
  amount: number;
};

export type MirrorTransactionInfo = {
  bytes: any;
  consensus_timestamp: string;
  parent_consensus_timestamp: string;
  transaction_hash: string;
  valid_start_timestamp: string;
  charged_tx_fee: number;
  transaction_id: string;
  memo_base64: string;
  result: string;
  entity_id: string;
  name: string;
  max_fee: string;
  valid_duration_seconds: number;
  node: string;
  transfers: MirrorTransactionInfoTransfer[];
  token_transfers: [];
  staking_reward_transfers: MirrorTransactionInfoStakingRewardTransfer[];
  nft_transfers: [];
  assessed_custom_fees: [];
  nonce: number;
  scheduled: boolean;
  links: {
    next: string;
  };
};
