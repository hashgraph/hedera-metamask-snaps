/* eslint-disable */

import { SnapsGlobalObject } from '@metamask/snaps-types';
import {
  getSnapStateUnchecked,
  initAccountState,
  initSnapState,
  updateSnapState,
} from '../../src/snap/state';
import { getInitialSnapState } from '../../src/utils/config';
import { ETH_ADDRESS, getDefaultSnapState } from '../testUtils/constants';
import { WalletMock, createMockWallet } from '../testUtils/wallet.mock';
import { DEFAULTCOINTYPE } from 'src/types/constants';

describe.skip('Utils [state]', () => {
  let walletMock: SnapsGlobalObject & WalletMock;

  beforeEach(() => {
    walletMock = createMockWallet();
  });

  describe('updateSnapState', () => {
    it('should succeed updating snap state with default state', async () => {
      const initialState = getDefaultSnapState();

      await expect(
        updateSnapState(walletMock, initialState),
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
        updateSnapState(walletMock, emptyState as any),
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
      await expect(getSnapStateUnchecked(walletMock)).resolves.toEqual(null);

      expect.assertions(1);
    });

    it('should succeed getting initial snap state', async () => {
      const initialState = getDefaultSnapState();
      walletMock.rpcMocks.snap_manageState.mockReturnValueOnce(initialState);

      await expect(getSnapStateUnchecked(walletMock)).resolves.toEqual(
        initialState,
      );

      expect.assertions(1);
    });
  });

  describe('initSnapState', () => {
    it('should succeed initializing snap state', async () => {
      const initialState = getInitialSnapState();

      await expect(initSnapState(walletMock)).resolves.toEqual(initialState);

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
