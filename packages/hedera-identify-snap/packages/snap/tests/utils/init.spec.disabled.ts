/* eslint-disable */

import { SnapsGlobalObject } from '@metamask/snaps-types';
import { getInitialSnapState } from '../../src/utils/config';
import { init } from '../../src/utils/init';
import { createMockWallet, WalletMock } from '../testUtils/wallet.mock';

describe.skip('RPC handler [init]', () => {
  let walletMock: SnapsGlobalObject & WalletMock;

  beforeEach(() => {
    walletMock = createMockWallet();
  });

  it('should succeed for accepted terms and conditions', async () => {
    const initialState = getInitialSnapState();
    walletMock.rpcMocks.snap_confirm.mockReturnValueOnce(true);

    await expect(init(walletMock)).resolves.toEqual(initialState);
    expect(walletMock.rpcMocks.snap_manageState).toHaveBeenCalledWith(
      'update',
      initialState,
    );

    expect.assertions(2);
  });

  it('should fail for rejected terms and conditions', async function () {
    walletMock.rpcMocks.snap_confirm.mockReturnValueOnce(false);

    await expect(init(walletMock)).rejects.toThrow(
      new Error('User did not accept terms and conditions!'),
    );

    expect.assertions(1);
  });
});
