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

/* eslint-disable */

import { SnapsGlobalObject } from '@metamask/snaps-types';
import { DEFAULTCOINTYPE } from 'src/types/constants';
import {
  getStateUnchecked,
  initAccountState,
  initState,
  updateState,
} from '../../src/snap/state';
import { getInitialSnapState } from '../../src/utils/config';
import { ETH_ADDRESS, getDefaultSnapState } from '../testUtils/constants';
import { WalletMock, createMockWallet } from '../testUtils/wallet.mock';

describe.skip('Utils [state]', () => {
  let walletMock: SnapsGlobalObject & WalletMock;

  beforeEach(() => {
    walletMock = createMockWallet();
  });

  describe('updateSnapState', () => {
    it('should succeed updating snap state with default state', async () => {
      const initialState = getDefaultSnapState();

      await expect(
        updateState(walletMock, initialState),
      ).resolves.not.toThrow();

      expect(walletMock.rpcMocks.snap_manageState).toHaveBeenCalledWith(
        'update',
        initialState,
      );

      expect.assertions(2);
    });

    it('should succeed updating snap state with empty state', async () => {
      const emptyState = {};

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        updateState(walletMock, emptyState as any),
      ).resolves.not.toThrow();

      expect(walletMock.rpcMocks.snap_manageState).toHaveBeenCalledWith(
        'update',
        emptyState,
      );

      expect.assertions(2);
    });
  });

  describe('getSnapStateUnchecked', () => {
    it('should return null if state is not initialized', async () => {
      await expect(getStateUnchecked(walletMock)).resolves.toEqual(null);

      expect.assertions(1);
    });

    it('should succeed getting initial snap state', async () => {
      const initialState = getDefaultSnapState();
      walletMock.rpcMocks.snap_manageState.mockReturnValueOnce(initialState);

      await expect(getStateUnchecked(walletMock)).resolves.toEqual(
        initialState,
      );

      expect.assertions(1);
    });
  });

  describe('initSnapState', () => {
    it('should succeed initializing snap state', async () => {
      const initialState = getInitialSnapState();

      await expect(initState(walletMock)).resolves.toEqual(initialState);

      expect(walletMock.rpcMocks.snap_manageState).toHaveBeenCalledWith(
        'update',
        initialState,
      );

      expect.assertions(2);
    });
  });

  describe('initAccountState', () => {
    it('should succeed initializing empty account state', async () => {
      const initialState = getInitialSnapState();
      const defaultState = getDefaultSnapState();
      //  defaultState.accountState[address].publicKey = publicKey;

      await expect(
        initAccountState(
          walletMock,
          initialState,
          DEFAULTCOINTYPE.toString(),
          ETH_ADDRESS,
        ),
      ).resolves.not.toThrow();

      expect(walletMock.rpcMocks.snap_manageState).toHaveBeenCalledWith(
        'update',
        defaultState,
      );

      expect.assertions(2);
    });
  });
});
