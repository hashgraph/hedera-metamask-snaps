/*-
 *
 * Hedera Wallet Snap
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

import type { SimpleTransfer } from './hedera';

export type MirrorNodeParams = { mirrorNodeUrl?: string };

export type ServiceFee = {
  percentageCut: number;
  toAddress?: string;
};

export type SignMessageRequestParams = {
  header?: string;
  message: string;
};

export type GetAccountInfoRequestParams = {
  accountId?: string;
  serviceFee?: ServiceFee;
  fetchUsingMirrorNode?: boolean;
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
  assetDecimals?: number;
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

export type TokenCustomFee = {
  feeCollectorAccountId: string; // Sets the fee collector account ID that collects the fee
  hbarAmount?: number; // Set the amount of HBAR to be collected
  tokenAmount?: number; // Sets the amount of tokens to be collected as the fee
  denominatingTokenId?: string; // The ID of the token used to charge the fee. The denomination of the fee is taken as HBAR if left unset
  allCollectorsAreExempt?: boolean; // If true, exempts all the token's fee collector accounts from this fee
};

export type CreateTokenRequestParams = {
  assetType: 'TOKEN' | 'NFT';
  name: string;
  symbol: string;
  decimals: number;
  initialSupply?: number;
  kycPublicKey?: string;
  freezePublicKey?: string;
  pausePublicKey?: string;
  wipePublicKey?: string;
  supplyPublicKey?: string;
  feeSchedulePublicKey?: string;
  freezeDefault?: boolean;
  expirationTime?: string;
  autoRenewAccountId?: string;
  tokenMemo?: string;
  customFees?: TokenCustomFee[];
  supplyType: 'FINITE' | 'INFINITE';
  maxSupply?: number;
};

export type MintTokenRequestParams = {
  assetType: 'TOKEN' | 'NFT';
  tokenId: string;
  amount?: number;
  metadata?: string[];
};

export type BurnTokenRequestParams = {
  assetType: 'TOKEN' | 'NFT';
  tokenId: string;
  amount?: number;
  serialNumbers?: number[];
};

export type PauseOrDeleteTokenRequestParams = {
  tokenId: string;
};

export type AssociateTokensRequestParams = {
  tokenIds: string[];
};

export type DissociateTokensRequestParams = {
  tokenIds: string[];
};

export type FreezeOrEnableKYCAccountRequestParams = {
  tokenId: string;
  accountId: string;
};

export type WipeTokenRequestParams = {
  assetType: 'TOKEN' | 'NFT';
  tokenId: string;
  accountId: string;
  amount?: number;
  serialNumbers?: number[];
};

export type UpdateTokenRequestParams = {
  tokenId: string;
  name?: string;
  symbol?: string;
  treasuryAccountId?: string;
  adminPublicKey?: string;
  kycPublicKey?: string;
  freezePublicKey?: string;
  feeSchedulePublicKey?: string;
  customFees?: TokenCustomFee[];
  pausePublicKey?: string;
  wipePublicKey?: string;
  supplyPublicKey?: string;
  expirationTime?: string;
  tokenMemo?: string;
  autoRenewAccountId?: string;
  autoRenewPeriod?: number;
};

export type UpdateTokenFeeScheduleRequestParams = {
  tokenId: string;
  customFees: TokenCustomFee[];
};
