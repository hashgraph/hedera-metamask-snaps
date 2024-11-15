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

import type {
  IdentifyAccountState,
  IdentifySnapState,
} from '../../types/state';
import { StateUtils } from '../StateUtils';

describe('StateUtils', () => {
  describe('getEmptyAccountState', () => {
    it('returns a deep clone of emptyAccountState', () => {
      const state: IdentifyAccountState = StateUtils.getEmptyAccountState();
      expect(state).toEqual({
        keyStore: {
          curve: 'ECDSA_SECP256K1',
          privateKey: '',
          publicKey: '',
          address: '',
          hederaAccountId: '',
        },
        accountInfo: {},
      });

      // Verify deep clone by mutation
      state.keyStore.curve = 'ED25519';
      const newState: IdentifyAccountState = StateUtils.getEmptyAccountState();
      expect(newState.keyStore.curve).toBe('ECDSA_SECP256K1');
    });
  });

  describe('getInitialSnapState', () => {
    it('returns a deep clone of initialSnapState', () => {
      const snapState: IdentifySnapState = StateUtils.getInitialSnapState();
      expect(snapState).toEqual({
        currentAccount: {},
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
      });

      // Verify deep clone by mutation
      snapState.snapConfig.dApp.disablePopups = true;
      const newSnapState: IdentifySnapState = StateUtils.getInitialSnapState();
      expect(newSnapState.snapConfig.dApp.disablePopups).toBe(false);
    });
  });
});
