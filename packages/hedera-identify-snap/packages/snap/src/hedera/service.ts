import type {
  AccountId,
  Hbar,
  HbarAllowance,
  Key,
  LedgerId,
  LiveHash,
  PrivateKey,
  PublicKey,
  Timestamp,
  TokenAllowance,
  TokenNftAllowance,
} from '@hashgraph/sdk';
import TokenRelationshipMap from '@hashgraph/sdk/lib/account/TokenRelationshipMap';
import Duration from '@hashgraph/sdk/lib/Duration';
import StakingInfo from '@hashgraph/sdk/lib/StakingInfo';
import { BigNumber } from 'bignumber.js';

import { WalletHedera } from './wallet/abstract';

export type HederaService = {
  // returns null if the account ID does not match the chosen key
  createClient(options: {
    network: string;
    walletHedera: WalletHedera;
    // index into the wallet, meaning depends on the wallet type
    // 0 always means the canonical key for the wallet
    keyIndex: number;
    // account ID we wish to associate with the wallet
    accountId: AccountId;
  }): Promise<SimpleHederaClient | null>;

  getAccountFromPublicKey(publicKey: string): Promise<HederaMirrorInfo | null>;

  getAccountFromEvmAddres(evmAddress: string): Promise<HederaMirrorInfo | null>;
};

export type SimpleHederaClient = {
  // get the associated private key, if available
  getPrivateKey(): PrivateKey | null;

  // get the associated public key
  getPublicKey(): PublicKey;

  // get the associated account ID
  getAccountId(): AccountId;

  getAccountInfo(accountId: string): Promise<HederaAccountInfo>;

  createAccountForPublicKey(options: {
    publicKey: PublicKey;
    initialBalance: BigNumber;
  }): Promise<HederaMirrorInfo | null>;

  createAccountForEvmAddress(options: {
    evmAddress: string;
    initialBalance: BigNumber;
  }): Promise<HederaMirrorInfo | null>;
};

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
