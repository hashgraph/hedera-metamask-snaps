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

export type TransferCryptoRequestParams = {
  transfers: SimpleTransfer[];
  memo?: string;
  maxFee?: number; // tinybars
};

export type ExternalAccountParams = {
  externalAccount: {
    accountIdOrEvmAddress: string;
    curve?: 'ECDSA_SECP256K1' | 'ED25519';
  };
};
