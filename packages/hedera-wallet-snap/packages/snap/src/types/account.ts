import { StakingInfoJson } from '@hashgraph/sdk/lib/account/AccountInfo';
import { AccountBalance } from '../services/hedera';

export type ExternalAccount = {
  externalAccount: {
    accountIdOrEvmAddress: string;
    curve?: 'ECDSA_SECP256K1' | 'ED25519';
  };
};

export type Account = {
  hederaAccountId: string;
  hederaEvmAddress: string;
  balance: AccountBalance;
  network: string;
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

export type NetworkParams = {
  network: string;
};
