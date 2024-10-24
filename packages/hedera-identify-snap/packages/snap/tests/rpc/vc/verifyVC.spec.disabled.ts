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
import { W3CVerifiableCredential } from '@veramo/core';
import { IDataManagerQueryResult } from 'src/plugins/veramo/verifiable-creds-manager';
import { onRpcRequest } from '../../../src';
import { getDefaultSnapState } from '../../testUtils/constants';
import { getRequestParams } from '../../testUtils/helper';
import { createMockSnap, SnapMock } from '../../testUtils/snap.mock';

describe('VerifyVC', () => {
  let snapMock: SnapMock;
  let metamask: MetaMaskInpageProvider;

  let credentials: W3CVerifiableCredential[];

  beforeAll(async () => {
    snapMock = createMockSnap();
    metamask = snapMock as unknown as MetaMaskInpageProvider;
  });

  beforeEach(async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(true);
    snapMock.rpcMocks.snap_manageState.mockReturnValue(getDefaultSnapState());
    snapMock.rpcMocks.snap_manageState('update', getDefaultSnapState());
    snapMock.rpcMocks.eth_chainId.mockReturnValue('0x1');

    const createVcRequest1 = getRequestParams('createVC', {
      vcValue: { prop: 10 },
      credTypes: ['Login'],
    });

    const createVcRequest2 = getRequestParams('createVC', {
      vcValue: { prop: 20 },
      credTypes: ['NotLogin'],
    });

    await onRpcRequest({ origin: 'tests', request: createVcRequest1 as any });
    await onRpcRequest({ origin: 'tests', request: createVcRequest2 as any });

    const getVcRequest = getRequestParams('getVCs', {});
    const vcsReturned: IDataManagerQueryResult[] = (await onRpcRequest({
      origin: 'tests',
      request: getVcRequest as any,
    })) as IDataManagerQueryResult[];

    credentials = vcsReturned.map((vc) => vc.data as W3CVerifiableCredential);
  });

  it('should verify VC', async () => {
    const verifyVCRequest = getRequestParams('verifyVC', {
      verifiableCredential: credentials[0],
    });
    await expect(
      onRpcRequest({ origin: 'tests', request: verifyVCRequest as any }),
    ).resolves.toBe(true);
    expect.assertions(1);
  });

  it('should reject if VC is tampered', async () => {
    const tamperedVC = JSON.parse(JSON.stringify(credentials[0]));

    tamperedVC.issuer.id =
      'did:pkh:eip155:296:0x7d871f006d97498ea338268a956af94ab2e65cde';

    const verifyVCRequest = getRequestParams('verifyVC', {
      verifiableCredential: tamperedVC,
    });
    await expect(
      onRpcRequest({ origin: 'tests', request: verifyVCRequest as any }),
    ).resolves.toBe(false);
    expect.assertions(1);
  });

  it('should reject if request invalid', async () => {
    const verifyVCRequest = getRequestParams('verifyVC', {
      credential: credentials[0],
    });
    await expect(
      onRpcRequest({ origin: 'tests', request: verifyVCRequest as any }),
    ).rejects.toThrow();
    expect.assertions(1);
  });
});
