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

import { SimpleTransfer } from '../services/hedera';

export type MirrorNodeParams = { mirrorNodeUrl?: string };

export type ServiceFee = {
  percentageCut: number;
  toAddress: string;
};

export type SignMessageRequestParams = {
  header?: string;
  message: string;
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

export type StakeHbarRequestParams = {
  nodeId?: number | null;
  accountId?: string | null;
};

export type DeleteAccountRequestParams = {
  transferAccountId: string;
};

export type ApproveAllowanceAssetDetail = {
  assetId: string;
  all?: boolean;
};

export type ApproveAllowanceRequestParams = {
  spenderAccountId: string;
  amount: number;
  assetType: 'HBAR' | 'TOKEN' | 'NFT';
  assetDetail?: ApproveAllowanceAssetDetail;
};

export type DeleteAllowanceRequestParams = {
  assetType: 'HBAR' | 'TOKEN' | 'NFT';
  assetId?: string;
  spenderAccountId?: string;
};
