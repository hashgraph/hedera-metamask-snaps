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
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { VerifiablePresentation } from '@veramo/core';
import { CreateVCResponseResult } from 'src/types/params';
import { onRpcRequest } from '../../../src';
import {
  ETH_ADDRESS,
  ETH_CHAIN_ID,
  getDefaultSnapState,
} from '../../testUtils/constants';
import { getRequestParams } from '../../testUtils/helper';
import { SnapMock, buildMockSnap } from '../../testUtils/snap.mock';

describe('createVP', () => {
  let snapMock: SnapsGlobalObject & SnapMock;
  let metamask: MetaMaskInpageProvider;

  const vcIds: string[] = [];

  beforeAll(async () => {
    snapMock = buildMockSnap(ETH_CHAIN_ID, ETH_ADDRESS);
    metamask = snapMock as unknown as MetaMaskInpageProvider;

    global.snap = snapMock;
    global.ethereum = metamask;
  });

  beforeEach(async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(true);
    snapMock.rpcMocks.snap_manageState.mockReturnValue(getDefaultSnapState());
    snapMock.rpcMocks.snap_manageState('update', getDefaultSnapState());

    const createVcRequest1 = getRequestParams('createVC', {
      vcValue: { prop: 10 },
      credTypes: ['Login'],
    });

    const createVcRequest2 = getRequestParams('createVC', {
      vcValue: { prop: 20 },
      credTypes: ['NotLogin'],
    });

    const createVcResponse1: CreateVCResponseResult = (await onRpcRequest({
      origin: 'tests',
      request: createVcRequest1 as any,
    })) as CreateVCResponseResult;
    const createVcResponse2: CreateVCResponseResult = (await onRpcRequest({
      origin: 'tests',
      request: createVcRequest2 as any,
    })) as CreateVCResponseResult;

    vcIds.push(createVcResponse1.metadata.id);
    vcIds.push(createVcResponse2.metadata.id);
  });

  it('should succeed creating VP from 1 VC', async () => {
    const createVpRequest = getRequestParams('createVP', {
      vcIds: [vcIds[0]],
    });

    const presentation = (await onRpcRequest({
      origin: 'tests',
      request: createVpRequest as any,
    })) as VerifiablePresentation;
    expect(presentation).not.toBeUndefined();
    expect.assertions(1);
  });

  it('should succeed creating VP from 2 VCs', async () => {
    const createVpRequest = getRequestParams('createVP', {
      vcIds,
    });

    const presentation = (await onRpcRequest({
      origin: 'tests',
      request: createVpRequest as any,
    })) as VerifiablePresentation;
    expect(presentation).not.toBeUndefined();
    expect(presentation.verifiableCredential?.length).toBe(2);
    expect.assertions(2);
  });

  // eslint-disable-next-line
  it.skip('should throw error when user rejects confirm', async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(false);

    const createVpRequest = getRequestParams('createVP', {
      vcs: [vcIds[0]],
    });

    await expect(
      onRpcRequest({
        origin: 'tests',
        request: createVpRequest as any,
      }),
    ).rejects.toThrow();
    expect.assertions(1);
  });
});
