import cloneDeep from 'lodash.clonedeep';

import { Account, AccountInfo } from '../types/account';
import { KeyStore, WalletAccountState, WalletSnapState } from '../types/state';

const emptyAccountState = {
  keyStore: {
    curve: 'ECDSA_SECP256K1',
    privateKey: '',
    publicKey: '',
    address: '',
    hederaAccountId: '',
  } as KeyStore,
  accountInfo: {} as AccountInfo,
} as WalletAccountState;

export const getEmptyAccountState = () => {
  return cloneDeep(emptyAccountState);
};

const initialSnapState: WalletSnapState = {
  currentAccount: {} as Account,
  accountState: {},
  snapConfig: {
    dApp: {
      disablePopups: false,
      friendlyDapps: [],
    },
    snap: {
      acceptedTerms: true,
    },
  },
};

export const getInitialSnapState = () => {
  return cloneDeep(initialSnapState);
};
