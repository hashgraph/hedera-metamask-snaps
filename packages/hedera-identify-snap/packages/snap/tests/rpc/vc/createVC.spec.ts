import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { CreateVCResponseResult } from 'src/types/params';
import { onRpcRequest } from '../../../src';
import { getDefaultSnapState } from '../../testUtils/constants';
import { getRequestParams } from '../../testUtils/helper';
import { createMockSnap, SnapMock } from '../../testUtils/snap.mock';

describe('createVC', () => {
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
    ).rejects.toThrowError();
    expect.assertions(1);
  });

  it('should throw exception if parameters invalid', async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(true);

    const createVcRequest = getRequestParams('createVC', {
      errorParam: {},
    });
    await expect(
      onRpcRequest({ origin: 'tests', request: createVcRequest as any }),
    ).rejects.toThrowError();
    expect.assertions(1);
  });
});
