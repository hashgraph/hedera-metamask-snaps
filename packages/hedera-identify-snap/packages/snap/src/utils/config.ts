import cloneDeep from 'lodash.clonedeep';
import {
  Account,
  GoogleUserInfo,
  IdentityAccountConfig,
  IdentityAccountState,
  IdentitySnapState,
} from '../interfaces';
import { DEFAULTCOINTYPE, HEDERACOINTYPE } from '../types/constants';

const emptyAccountState = {
  snapPrivateKeyStore: {},
  snapKeyStore: {},
  identifiers: {},
  vcs: {},
  index: 0,
  accountConfig: {
    identity: {
      didMethod: 'did:pkh',
      vcStore: 'snap',
      googleUserInfo: {} as GoogleUserInfo,
    },
  } as IdentityAccountConfig,
} as IdentityAccountState;

export const getEmptyAccountState = () => {
  return cloneDeep(emptyAccountState);
};

const initialSnapState: IdentitySnapState = {
  currentAccount: {} as Account,
  accountState: {
    [DEFAULTCOINTYPE]: {},
    [HEDERACOINTYPE]: {},
  },
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
