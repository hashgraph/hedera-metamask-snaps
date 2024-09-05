import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { IDataManagerQueryResult } from 'src/plugins/veramo/verifiable-creds-manager';
import { CreateVCResponseResult } from 'src/types/params';
import { onRpcRequest } from '../../../src';
import { getRequestParams } from '../../testUtils/helper';
// import { connectHederaAccount } from '../../../src/rpc/hedera/connectHederaAccount';
import { getDefaultSnapState } from '../../testUtils/constants';
import { createMockSnap, SnapMock } from '../../testUtils/snap.mock';

describe('getVCs', () => {
  let snapMock: SnapsGlobalObject & SnapMock;
  let metamask: MetaMaskInpageProvider;

  beforeAll(async () => {
    snapMock = createMockSnap();
    metamask = snapMock as unknown as MetaMaskInpageProvider;

    global.snap = snapMock;
    global.ethereum = metamask;
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
  });

  it('should succeed returning VCS without filter', async () => {
    const getVcRequest = getRequestParams('getVCs', {});
    const vcsReturned: IDataManagerQueryResult[] = (await onRpcRequest({
      origin: 'tests',
      request: getVcRequest as any,
    })) as IDataManagerQueryResult[];

    expect(vcsReturned.length).toBe(2);

    expect.assertions(1);
  });

  it('should filter Login Type VCs', async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(true);

    const getVcRequest = getRequestParams('getVCs', {
      options: {},
      filter: { type: 'vcType', filter: 'Login' },
    });

    const vcsReturned: IDataManagerQueryResult[] = (await onRpcRequest({
      origin: 'tests',
      request: getVcRequest as any,
    })) as IDataManagerQueryResult[];

    expect(vcsReturned.length).toBe(1);
    expect.assertions(1);
  });

  it('should return empty if filter is invalid', async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(true);

    const getVcRequest = getRequestParams('getVCs', {
      options: {},
      filter: { type: 'invalidFilter', filter: 'Login' },
    });

    await expect(
      onRpcRequest({ origin: 'tests', request: getVcRequest as any }),
    ).resolves.toStrictEqual([]);

    expect.assertions(1);
  });

  it('should filter VCs by id', async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(true);

    const createVcRequest = getRequestParams('createVC', {
      vcValue: { prop: 30 },
    });

    const createVcResponse: CreateVCResponseResult = (await onRpcRequest({
      origin: 'tests',
      request: createVcRequest as any,
    })) as CreateVCResponseResult;

    const getVcRequest = getRequestParams('getVCs', {
      options: {},
      filter: { type: 'id', filter: createVcResponse.metadata.id },
    });

    const vcsReturned: IDataManagerQueryResult[] = (await onRpcRequest({
      origin: 'tests',
      request: getVcRequest as any,
    })) as IDataManagerQueryResult[];

    expect(vcsReturned.length).toBe(1);
    expect.assertions(1);
  });

  it('should return empty if user rejects confirm', async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(false);

    const getVcRequest = getRequestParams('getVCs', {});
    await expect(
      onRpcRequest({ origin: 'tests', request: getVcRequest as any }),
    ).resolves.toStrictEqual([]);

    expect.assertions(1);
  });
});
