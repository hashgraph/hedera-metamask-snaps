import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';
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
  let snapMock: SnapsGlobalObject & SnapMock;
  let metamask: MetaMaskInpageProvider;

  let currentDID = exampleDIDPkh;

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
    })) as DIDResolutionResult;

    expect(resolvedDID.didDocument?.id).toBe(currentDID);
    expect.assertions(1);
  });
});
