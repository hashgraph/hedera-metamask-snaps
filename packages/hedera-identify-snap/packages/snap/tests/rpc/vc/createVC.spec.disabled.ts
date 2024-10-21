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

/* eslint-disable no-restricted-globals */

import { MetaMaskInpageProvider } from '@metamask/providers';
import { CreateVCResponseResult } from 'src/types/params';
import { onRpcRequest } from '../../../src';
import { getDefaultSnapState } from '../../testUtils/constants';
import { getRequestParams } from '../../testUtils/helper';
import { createMockSnap, SnapMock } from '../../testUtils/snap.mock';

describe('createVC', () => {
  let snapMock: SnapMock;
  let metamask: MetaMaskInpageProvider;

  beforeAll(async () => {
    snapMock = createMockSnap();
    metamask = snapMock as unknown as MetaMaskInpageProvider;
  });

  beforeEach(async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(true);
    snapMock.rpcMocks.snap_manageState.mockReturnValue(getDefaultSnapState());
    snapMock.rpcMocks.snap_manageState('update', getDefaultSnapState());
    snapMock.rpcMocks.eth_chainId.mockReturnValue('0x1');
  });

  it('should create VC', async () => {
    const createVcRequest = getRequestParams('createVC', {
      vcValue: { prop: 10 },
      credTypes: ['Login'],
    });

    const createVcResponse = (await onRpcRequest({
      origin: 'tests',
      request: createVcRequest as any,
    })) as CreateVCResponseResult;
    expect(createVcResponse.data).not.toBeUndefined();
    expect.assertions(1);
  });

  it('should throw exception if user refuses confirmation', async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(false);

    const createVcRequest = getRequestParams('createVC', {
      vcValue: { prop: 20 },
      credTypes: ['Login'],
    });
    await expect(
      onRpcRequest({ origin: 'tests', request: createVcRequest as any }),
    ).rejects.toThrow();
    expect.assertions(1);
  });

  it('should throw exception if parameters invalid', async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(true);

    const createVcRequest = getRequestParams('createVC', {
      errorParam: {},
    });
    await expect(
      onRpcRequest({ origin: 'tests', request: createVcRequest as any }),
    ).rejects.toThrow();
    expect.assertions(1);
  });
});
