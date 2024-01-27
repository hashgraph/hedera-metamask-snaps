/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Tuum Tech
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

export type GetSnapsResponse = Record<string, Snap>;

export type Snap = {
  permissionName: string;
  id: string;
  version: string;
  initialPermissions: Record<string, unknown>;
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

export type Account = {
  hederaAccountId: string;
  hederaEvmAddress: string;
  balance: AccountBalance;
  network: string;
};

export type SimpleTransfer = {
  // HBAR or Token ID (as string)
  asset: string;
  to: string;
  // amount must be in low denom
  amount: number;
};

export type ServiceFee = {
  percentageCut: number;
  toAddress: string;
};

export type GetAccountInfoRequestParams = {
  accountId?: string;
  serviceFee?: ServiceFee;
};

export type GetTransactionsRequestParams = {
  transactionId?: string;
};

export type TransferCryptoRequestParams = {
  transfers: SimpleTransfer[];
  memo?: string;
  maxFee?: number; // hbars
  serviceFee?: ServiceFee;
};

export type SignMessageRequestParams = {
  header?: string | undefined;
  message: string;
};

export type StakeHbarRequestParams = {
  nodeId?: number;
  accountId?: string;
};

export type ExternalAccountParams = {
  externalAccount: {
    accountIdOrEvmAddress: string;
    curve?: 'ECDSA_SECP256K1' | 'ED25519';
  };
};
