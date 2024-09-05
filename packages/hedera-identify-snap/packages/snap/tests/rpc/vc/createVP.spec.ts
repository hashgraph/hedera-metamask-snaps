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
      vcIds: [vcIds[0] as string],
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
      vcs: [vcIds[0] as string],
    });

    await expect(
      onRpcRequest({
        origin: 'tests',
        request: createVpRequest as any,
      }),
    ).rejects.toThrowError();
    expect.assertions(1);
  });
});
