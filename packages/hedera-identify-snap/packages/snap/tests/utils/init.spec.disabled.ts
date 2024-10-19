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
