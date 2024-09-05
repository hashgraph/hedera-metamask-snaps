import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';
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
  let snapMock: SnapsGlobalObject & SnapMock;
  let metamask: MetaMaskInpageProvider;

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
  });

  // enable test when there's more than a method
  // eslint-disable-next-line
  it.skip('should change snap state when switch to did:pkh methods', async () => {
    const snapState = getDefaultSnapState();
    const accountType = await getAccountStateByCoinType(snapState, ETH_ADDRESS);
    accountType.accountConfig.identity.didMethod = 'did:key';

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
    ).rejects.toThrowError();

    expect.assertions(1);
  });

  it('should not switch method when user rejects', async () => {
    snapMock.rpcMocks.snap_dialog.mockReturnValue(false);

    const snapState = getDefaultSnapState();
    const accountType = await getAccountStateByCoinType(snapState, ETH_ADDRESS);
    accountType.accountConfig.identity.didMethod = 'did:key';

    snapState.accountState['60'][ETH_ADDRESS] = accountType;

    snapMock.rpcMocks.snap_manageState.mockReturnValue(snapState);

    const switchDIDMethodRequestParams = getRequestParams('switchDIDMethod', {
      didMethod: 'did:pkh',
    });

    const request = onRpcRequest({
      origin: 'tests',
      request: switchDIDMethodRequestParams as any,
    });
    await expect(request).rejects.toThrowError();
    expect.assertions(1);
  });
});
