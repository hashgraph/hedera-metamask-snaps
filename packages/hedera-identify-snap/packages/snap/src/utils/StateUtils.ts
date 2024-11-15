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

import cloneDeep from 'lodash.clonedeep';

import type { Account, HederaAccountInfo } from '../types/account';
import type {
  IdentifyAccountState,
  IdentifySnapState,
  KeyStore,
} from '../types/state';

export class StateUtils {
  static readonly #emptyAccountState: IdentifyAccountState = {
    keyStore: {
      curve: 'ECDSA_SECP256K1',
      privateKey: '',
      publicKey: '',
      address: '',
      hederaAccountId: '',
    } as KeyStore,
    accountInfo: {} as HederaAccountInfo,
  } as IdentifyAccountState;

  public static getEmptyAccountState(): IdentifyAccountState {
    return cloneDeep(this.#emptyAccountState);
  }

  static readonly #initialSnapState: IdentifySnapState = {
    currentAccount: {} as Account,
    accountState: {},
    snapConfig: {
      dApp: {
        didMethod: 'did:pkh',
        disablePopups: false,
        friendlyDapps: [],
      },
      snap: {
        acceptedTerms: true,
      },
    },
  };

  public static getInitialSnapState(): IdentifySnapState {
    return cloneDeep(this.#initialSnapState);
  }
}
