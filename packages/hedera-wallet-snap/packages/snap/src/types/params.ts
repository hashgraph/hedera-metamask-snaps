import { SimpleTransfer } from '../services/hedera';

export type MirrorNodeParams = { mirrorNodeUrl?: string };

export type GetAccountInfoRequestParams = { accountId?: string };

export type TransferCryptoRequestParams = {
  transfers: SimpleTransfer[];
  memo?: string;
  maxFee?: number; // tinybars
};
