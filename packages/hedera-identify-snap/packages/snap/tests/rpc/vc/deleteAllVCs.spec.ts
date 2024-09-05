import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { onRpcRequest } from '../../../src';
import { getDefaultSnapState } from '../../testUtils/constants';
import { getRequestParams } from '../../testUtils/helper';
import { createMockSnap, SnapMock } from '../../testUtils/snap.mock';

describe('delete all VCs', () => {
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

  it('should delete all VC', async () => {
    const deleteAllVcsRequest = getRequestParams('deleteAllVCs', {
      options: { store: 'snap' },
    });

    await expect(
      onRpcRequest({ origin: 'tests', request: deleteAllVcsRequest as any }),
    ).resolves.not.toBeUndefined();

    expect.assertions(1);
  });

  it('should throw exception if user refused confirmation', async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(false);

    const deleteAllVcsRequest = getRequestParams('deleteAllVCs', {
      options: { store: 'snap' },
    });

    await expect(
      onRpcRequest({ origin: 'tests', request: deleteAllVcsRequest as any }),
    ).rejects.toThrowError();

    expect.assertions(1);
  });
});
