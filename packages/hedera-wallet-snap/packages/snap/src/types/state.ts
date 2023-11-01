import { Panel } from '@metamask/snaps-ui';

import { Account, AccountInfo } from './account';

export type WalletSnapState = {
  currentAccount: Account;

  /**
   * Account specific storage
   * mapping(evm address -> mapping(network -> state))
   */
  accountState: Record<string, Record<string, WalletAccountState>>;

  /**
   * Configuration for WalletSnap
   */
  snapConfig: WalletSnapConfig;
};

export type WalletSnapConfig = {
  snap: {
    acceptedTerms: boolean;
  };
  dApp: {
    disablePopups: boolean;
    friendlyDapps: string[];
  };
};

export type KeyStore = {
  curve: 'ECDSA_SECP256K1' | 'ED25519';
  privateKey: string;
  publicKey: string;
  address: string;
  hederaAccountId: string;
};

/**
 * Wallet Snap State for a MetaMask address
 */
export type WalletAccountState = {
  keyStore: KeyStore;
  mirrorNodeUrl: string;
  accountInfo: AccountInfo;
};

export type WalletSnapParams = {
  origin: string;
  state: WalletSnapState;
  mirrorNodeUrl: string;
};

export type SnapDialogParams = {
  type: 'alert' | 'confirmation' | 'prompt';
  content: Panel;
  placeholder?: string;
};
