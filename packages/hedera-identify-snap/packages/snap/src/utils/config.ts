/*-
 *
 * Hedera Identify Snap
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
