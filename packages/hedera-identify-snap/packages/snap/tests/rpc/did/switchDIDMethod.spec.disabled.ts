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
import { onRpcRequest } from '../../../src';
import { getAccountStateByCoinType } from '../../../src/snap/state';
import {
  ETH_ADDRESS,
  ETH_CHAIN_ID,
  getDefaultSnapState,
} from '../../testUtils/constants';
import { getRequestParams } from '../../testUtils/helper';
import { SnapMock, buildMockSnap } from '../../testUtils/snap.mock';

describe('SwitchDIDMethod', () => {
  let snapMock: SnapMock;
  let metamask: MetaMaskInpageProvider;

  beforeAll(async () => {
    snapMock = buildMockSnap(ETH_CHAIN_ID, ETH_ADDRESS);
    metamask = snapMock as unknown as MetaMaskInpageProvider;
  });

  beforeEach(async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(true);
    snapMock.rpcMocks.snap_manageState.mockReturnValue(getDefaultSnapState());
    snapMock.rpcMocks.snap_manageState('update', getDefaultSnapState());
  });

  // enable test when there's more than a method
  // eslint-disable-next-line
  it.skip('should change snap state when switch to did:pkh methods', async () => {
    const snapState = getDefaultSnapState();
    const accountType = await getAccountStateByCoinType(snapState, ETH_ADDRESS);
    snapState.snapConfig.dApp.didMethod = 'did:key';

    snapState.accountState['60'][ETH_ADDRESS] = accountType;

    snapMock.rpcMocks.snap_manageState.mockReturnValue(snapState);

    const switchDIDMethodRequestParams = getRequestParams('switchDIDMethod', {
      didMethod: 'did:pkh',
    });

    const request = onRpcRequest({
      origin: 'tests',
      request: switchDIDMethodRequestParams as any,
    });
    await expect(request).resolves.toBe(true);
    expect.assertions(1);
  });

  it('should do nothing when changing method to current did:pkh method', async () => {
    const switchDIDMethodRequestParams = getRequestParams('switchDIDMethod', {
      didMethod: 'did:pkh',
    });

    const request = onRpcRequest({
      origin: 'tests',
      request: switchDIDMethodRequestParams as any,
    });
    await expect(request).resolves.toBe(true);
    expect.assertions(1);
  });

  it('should throw error when switch to invalid method', async () => {
    const switchDIDMethodRequestParams = getRequestParams('switchDIDMethod', {
      didMethod: 'did:inv',
    });

    await expect(
      onRpcRequest({
        origin: 'tests',
        request: switchDIDMethodRequestParams as any,
      }),
    ).rejects.toThrow();

    expect.assertions(1);
  });

  it('should not switch method when user rejects', async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(false);

    const snapState = getDefaultSnapState();
    const accountType = await getAccountStateByCoinType(snapState, ETH_ADDRESS);
    snapState.snapConfig.dApp.didMethod = 'did:key';

    snapState.accountState['60'][ETH_ADDRESS] = accountType;

    snapMock.rpcMocks.snap_manageState.mockReturnValue(snapState);

    const switchDIDMethodRequestParams = getRequestParams('switchDIDMethod', {
      didMethod: 'did:pkh',
    });

    const request = onRpcRequest({
      origin: 'tests',
      request: switchDIDMethodRequestParams as any,
    });
    await expect(request).rejects.toThrow();
    expect.assertions(1);
  });
});
