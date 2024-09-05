import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { VerifiablePresentation } from '@veramo/core';
import { CreateVCResponseResult } from 'src/types/params';
import { buildMockSnap, SnapMock } from '../../testUtils/snap.mock';

import { onRpcRequest } from '../../../src';
import {
  ETH_ADDRESS,
  ETH_CHAIN_ID,
  getDefaultSnapState,
} from '../../testUtils/constants';
import { getRequestParams } from '../../testUtils/helper';

describe('VerifyVP', () => {
  let snapMock: SnapsGlobalObject & SnapMock;
  let metamask: MetaMaskInpageProvider;

  const vcIds: string[] = [];
  let presentation: VerifiablePresentation;

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

    const createVpRequest = getRequestParams('createVP', {
      vcIds,
    });

    presentation = (await onRpcRequest({
      origin: 'tests',
      request: createVpRequest as any,
    })) as VerifiablePresentation;
  });

  it('should verify valid VP', async () => {
    const verifyVPRequest = getRequestParams('verifyVP', {
      verifiablePresentation: presentation,
    });

    const verifyVPResponse = onRpcRequest({
      origin: 'tests',
      request: verifyVPRequest as any,
    });

    await expect(verifyVPResponse).resolves.toBe(true);
    expect.assertions(1);
  });

  it('should refuse validation when VP is adultered', async () => {
    // Setup
    snapMock.rpcMocks.snap_dialog.mockReturnValue(false);

    const adultered = JSON.parse(JSON.stringify(presentation));

    adultered.proof.jwt =
      '1.eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2cCI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVQcmVzZW50YXRpb24iLCJDdXN0b20iXSwidmVyaWZpYWJsZUNyZWRlbnRpYWwiOlsiZXlKaGJHY2lPaUpGVXpJMU5rc2lMQ0owZVhBaU9pSktWMVFpZlEuZXlKbGVIQWlPakUzTURneU56a3lPRElzSW5aaklqcDdJa0JqYjI1MFpYaDBJanBiSW1oMGRIQnpPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1ERTRMMk55WldSbGJuUnBZV3h6TDNZeElsMHNJblI1Y0dVaU9sc2lWbVZ5YVdacFlXSnNaVU55WldSbGJuUnBZV3dpWFN3aVkzSmxaR1Z1ZEdsaGJGTjFZbXBsWTNRaU9uc2lkbU5FWVhSaElqcDdJbkJ5YjNBaU9qRXdmU3dpYUdWa1pYSmhRV05qYjNWdWRFbGtJam9pTUM0d0xqRTFNakUxSW4xOUxDSnBjM04xWlhJaU9uc2lhR1ZrWlhKaFFXTmpiM1Z1ZEVsa0lqb2lNQzR3TGpFMU1qRTFJbjBzSW5OMVlpSTZJbVJwWkRwd2EyZzZaV2x3TVRVMU9qSTVOam93ZURka09EY3haakF3Tm1RNU56UTVPR1ZoTXpNNE1qWTRZVGsxTm1GbU9UUmhZakpsTmpWalpHUWlMQ0p1WW1ZaU9qRTJOelkzTkRNeU9ESXNJbWx6Y3lJNkltUnBaRHB3YTJnNlpXbHdNVFUxT2pJNU5qb3dlRGRrT0RjeFpqQXdObVE1TnpRNU9HVmhNek00TWpZNFlUazFObUZtT1RSaFlqSmxOalZqWkdRaWZRLmRySGdXTzhSM0lBaHZTbEJZTFNLNnlObnJkTjMwRDkwZFluSmUxN1FtclZ3cS1nU2psQ2REd1dnV1pzRFFxRXZlblRoSHpLeHZIRVVkbmN2Q0xyTkZnIl19LCJuYmYiOjE2NzY3NDMyODIsImlzcyI6ImRpZDpwa2g6ZWlwMTU1OjI5NjoweDdkODcxZjAwNmQ5NzQ5OGVhMzM4MjY4YTk1NmFmOTRhYjJlNjVjZGQifQ.3rRRKLtrTcsiAzXHgmQVjZOG2YZKBxomIwbZC6nFPaUNyaBTLOLEw8ZAmVpdWRXA-K7OjlPtcyaz4IMn-iaUlg';

    const verifyVPRequest = getRequestParams('verifyVP', {
      verifiablePresentation: adultered,
    });

    const verifyVPResponse = onRpcRequest({
      origin: 'tests',
      request: verifyVPRequest as any,
    });

    await expect(verifyVPResponse).rejects.toThrowError();
  });
});
