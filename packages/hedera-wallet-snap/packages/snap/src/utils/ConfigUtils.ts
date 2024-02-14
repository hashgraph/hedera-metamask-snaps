/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2023 Tuum Tech
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

import { Account, AccountInfo } from '../types/account';
import { KeyStore, WalletAccountState, WalletSnapState } from '../types/state';

export class StateUtils {
  private static readonly emptyAccountState: WalletAccountState = {
    keyStore: {
      curve: 'ECDSA_SECP256K1',
      privateKey: '',
      publicKey: '',
      address: '',
      hederaAccountId: '',
    } as KeyStore,
    accountInfo: {} as AccountInfo,
  } as WalletAccountState;

  public static getEmptyAccountState(): WalletAccountState {
    return structuredClone(this.emptyAccountState);
  }

  private static readonly initialSnapState: WalletSnapState = {
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

  public static getInitialSnapState(): WalletSnapState {
    return structuredClone(this.initialSnapState);
  }
}
