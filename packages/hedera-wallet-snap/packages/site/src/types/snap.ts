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

export type Account = {
  metamaskEvmAddress: string;
  externalEvmAddress: string;
  hederaAccountId: string;
  hederaEvmAddress: string;
  publicKey: string;
  balance: AccountBalance;
  network: string;
  mirrorNodeUrl: string;
};

export type SimpleTransfer = {
  assetType: 'HBAR' | 'TOKEN' | 'NFT';
  to: string;
  amount: number; // amount must be in low denom
  assetId?: string; // Token or NFT ID (as string)
  from?: string; // Only for approved allowances
};

export type ServiceFee = {
  percentageCut: number;
  toAddress: string;
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

export type SignMessageRequestParams = {
  header?: string | undefined;
  message: string;
};

export type StakeHbarRequestParams = {
  nodeId?: number | null;
  accountId?: string | null;
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
  assetId: string;
  spenderAccountId?: string;
};

export type DeleteAccountRequestParams = {
  transferAccountId: string;
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

export type ExternalAccountParams = {
  externalAccount: {
    accountIdOrEvmAddress: string;
    curve?: 'ECDSA_SECP256K1' | 'ED25519';
  };
};

export type InitiateSwapRequestParams = {
  atomicSwaps: AtomicSwap[];
  memo?: string;
  maxFee?: number; // hbars
  serviceFee?: ServiceFee;
};

export enum AssetType {
  HBAR = 'HBAR',
  TOKEN = 'TOKEN',
  NFT = 'NFT',
}

export type AtomicSwap = {
  requester: SimpleTransfer;
  responder: SimpleTransfer;
};

export type SignScheduledTxParams = {
  scheduleId: string;
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

export type CreateSmartContractRequestParams = {
  gas: number;
  bytecode: string;
  initialBalance?: number;
  adminKey?: string;
  constructorParameters?: string;
  contractMemo?: string;
  stakedNodeId?: number;
  stakedAccountId?: string;
  declineStakingReward?: boolean;
  autoRenewAccountId?: string;
  autoRenewPeriod?: number;
  maxAutomaticTokenAssociations?: number;
};

export type UpdateSmartContractRequestParams = {
  contractId: string;
  adminKey?: string;
  contractMemo?: string;
  expirationTime?: string;
  maxAutomaticTokenAssociations?: number;
  stakedAccountId?: string;
  stakedNodeId?: number;
  declineStakingReward?: boolean;
  autoRenewPeriod?: number;
  autoRenewAccountId?: string;
};

export type DeleteSmartContractRequestParams = {
  contractId: string;
  transferAccountId?: string;
  transferContractId?: string;
};

export type CallSmartContractFunctionRequestParams = {
  contractId: string;
  functionName: string;
  functionParams?: string;
  gas: number;
  payableAmount?: number;
};

export type GetSmartContractFunctionRequestParams = {
  contractId: string;
  functionName: string;
  functionParams?: string;
  gas: number;
  senderAccountId?: string;
};
