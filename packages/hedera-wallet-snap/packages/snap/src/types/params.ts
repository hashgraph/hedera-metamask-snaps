import { SimpleTransfer } from '../services/hedera';

export type MirrorNodeParams = { mirrorNodeUrl?: string };

export type ServiceFee = {
  percentageCut: number;
  toAddress: string;
};

export type GetAccountInfoRequestParams = {
  accountId?: string;
  serviceFee?: ServiceFee;
};

export type TransferCryptoRequestParams = {
  transfers: SimpleTransfer[];
  memo?: string;
  maxFee?: number; // hbars
  serviceFee?: ServiceFee;
};
