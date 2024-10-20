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
import { DIDResolutionResult } from 'did-resolver';
import { PublicAccountInfo } from 'src/interfaces';
import { onRpcRequest } from '../../../src';
import {
  ETH_ADDRESS,
  ETH_CHAIN_ID,
  exampleDIDPkh,
  getDefaultSnapState,
} from '../../testUtils/constants';
import { getRequestParams } from '../../testUtils/helper';
import { SnapMock, buildMockSnap } from '../../testUtils/snap.mock';

describe('resolveDID', () => {
  let snapMock: SnapMock;
  let metamask: MetaMaskInpageProvider;

  let currentDID = exampleDIDPkh;

  beforeAll(async () => {
    snapMock = buildMockSnap(ETH_CHAIN_ID, ETH_ADDRESS);
    metamask = snapMock as unknown as MetaMaskInpageProvider;
  });

  beforeEach(async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(true);
    snapMock.rpcMocks.snap_manageState.mockReturnValue(getDefaultSnapState());
    snapMock.rpcMocks.snap_manageState('update', getDefaultSnapState());

    const getAccountInfoRequestParams = getRequestParams('getAccountInfo', {});

    const accountInfo = (await onRpcRequest({
      origin: 'tests',
      request: getAccountInfoRequestParams as any,
    })) as PublicAccountInfo;

    currentDID = accountInfo.did;
  });

  it('should succeed returning current did resolved', async () => {
    const resolveDIDRequestParams = getRequestParams('resolveDID', {});

    const resolvedDID = (await onRpcRequest({
      origin: 'tests',
      request: resolveDIDRequestParams as any,
    })) as any;

    expect(resolvedDID.didDocument?.id).toBe(currentDID);
    expect.assertions(1);
  });
});
