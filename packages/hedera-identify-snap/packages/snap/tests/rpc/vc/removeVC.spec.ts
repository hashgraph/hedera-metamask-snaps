import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { W3CVerifiableCredential } from '@veramo/core';
import {
  IDataManagerDeleteResult,
  IDataManagerQueryResult,
} from 'src/plugins/veramo/verifiable-creds-manager';
import { CreateVCResponseResult } from 'src/types/params';
import { onRpcRequest } from '../../../src';
import {
  ETH_ADDRESS,
  ETH_CHAIN_ID,
  getDefaultSnapState,
} from '../../testUtils/constants';
import { getRequestParams } from '../../testUtils/helper';
import { SnapMock, buildMockSnap } from '../../testUtils/snap.mock';

describe('RemoveVC', () => {
  let snapMock: SnapsGlobalObject & SnapMock;
  let metamask: MetaMaskInpageProvider;

  const vcs: W3CVerifiableCredential[] = [];

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

    vcs.push(createVcResponse1.metadata.id);
    vcs.push(createVcResponse2.metadata.id);
  });

  it('should remove VC', async () => {
    const removeVcRequest = getRequestParams('removeVC', {
      id: vcs[0],
      options: {},
    });

    const removeVcResponse = (await onRpcRequest({
      origin: 'tests',
      request: removeVcRequest as any,
    })) as IDataManagerDeleteResult[];
    expect(removeVcResponse.length).toBe(1);

    // redo request
    const getVcRequest = getRequestParams('getVCs', {});
    const vcsReturned: IDataManagerQueryResult[] = (await onRpcRequest({
      origin: 'tests',
      request: getVcRequest as any,
    })) as IDataManagerQueryResult[];

    expect(vcsReturned.length).toBe(1);

    expect.assertions(2);
  });

  it('should throw exception if user refused confirmation', async () => {
    // Setup
    snapMock.rpcMocks.snap_dialog.mockReturnValue(false);

    const removeVcRequest = getRequestParams('removeVC', {
      id: vcs[0],
      options: {},
    });

    await expect(
      onRpcRequest({
        origin: 'tests',
        request: removeVcRequest as any,
      }),
    ).rejects.toThrowError();

    expect.assertions(1);
  });
});
