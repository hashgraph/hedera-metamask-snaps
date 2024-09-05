/* eslint-disable */
import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { onRpcRequest } from '../../../src';
import { getRequestParams } from '../../../tests/testUtils/helper';
import { getDefaultSnapState } from '../../testUtils/constants';
import { createMockSnap, SnapMock } from '../../testUtils/snap.mock';

describe('saveVC', () => {
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

  it('should succeed saving passing VC', async () => {
    // Get Veramo agent
    // const agent = new VeramoAgent(identitySnapParams);
    // (identitySnapParams.snap as SnapMock).rpcMocks.snap_dialog.mockReturnValue(
    //   true,
    // );
    // const identifier = await agent.agent.didManagerCreate({
    //   kms: 'snap',
    //   provider: 'did:pkh',
    //   options: { chainId: '1' },
    // });
    // snapState.accountState[snapState.currentAccount].identifiers[
    //   identifier.did
    // ] = identifier;
    // const credential = await getDefaultCredential(agent);
    // const params: SaveVCRequestParams = {
    //   verifiableCredentials: [credential],
    //   options: {},
    // };
    // const result = await saveVC(identitySnapParams, params);
    // expect(result.length).toBe(1);
    // expect.assertions(1);
  });

  it('should succeed saving 2 VCs', async () => {
    // // Get Veramo agent
    // const agent = new VeramoAgent(identitySnapParams);
    // (identitySnapParams.snap as SnapMock).rpcMocks.snap_dialog.mockReturnValue(
    //   true,
    // );
    // const identifier = await agent.agent.didManagerCreate({
    //   kms: 'snap',
    //   provider: 'did:pkh',
    //   options: { chainId: '1' },
    // });
    // snapState.accountState[snapState.currentAccount].identifiers[
    //   identifier.did
    // ] = identifier;
    // const credential1 = await getDefaultCredential(agent, 'type1');
    // const credential2 = await getDefaultCredential(agent, 'type2');
    // const params: SaveVCRequestParams = {
    //   verifiableCredentials: [credential1, credential2],
    //   options: {},
    // };
    // const result = await saveVC(identitySnapParams, params);
    // expect(result.length).toBe(2);
    // expect.assertions(1);
  });

  it('should not save VCs which subject doesnt match current account', async () => {
    // // Get Veramo agent
    // const agent = new VeramoAgent(identitySnapParams);
    // (identitySnapParams.snap as SnapMock).rpcMocks.snap_dialog.mockReturnValue(
    //   true,
    // );
    // const identifier = await agent.agent.didManagerCreate({
    //   kms: 'snap',
    //   provider: 'did:pkh',
    //   options: { chainId: '1' },
    // });
    // snapState.accountState[snapState.currentAccount].identifiers[
    //   identifier.did
    // ] = identifier;
    // const credential1 = await getDefaultCredential(agent, 'type1');
    // let credential2: any = await getDefaultCredential(agent, 'type2');
    // console.log(JSON.stringify(credential2));
    // credential2 = JSON.parse(JSON.stringify(credential2, null, 4));
    // credential2.credentialSubject.id =
    //   '0x7d871f006d97498ea3382688756af94ab2e65caa';
    // const params: SaveVCRequestParams = {
    //   verifiableCredentials: [credential1, credential2],
    //   options: {},
    // };
    // const result = await saveVC(identitySnapParams, params);
    // expect(result.length).toBe(1);
    // expect.assertions(1);
  });

  it('should not save VCs when params invalid', async () => {
    //let data: ISaveVC = [ vc: {} as VerifiedCredential
    const createVcRequest = getRequestParams('saveVC', {
      data: {
        verifiableCredentials: [],
      },
    });

    await expect(
      onRpcRequest({
        origin: 'tests',
        request: createVcRequest as any,
      }),
    ).rejects.toThrowError();

    expect.assertions(1);
  });
});
