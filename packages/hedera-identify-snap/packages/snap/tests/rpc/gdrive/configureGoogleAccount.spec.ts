/* eslint-disable */
import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { GoogleToken, IdentitySnapParams } from '../../../src/interfaces';
import { SnapMock } from '../../testUtils/snap.mock';

describe('ConfigureGoogleAccount', () => {
  let identitySnapParams: IdentitySnapParams;
  let googleToken: GoogleToken;
  let snapState: GoogleToken;
  let snapMock: SnapsGlobalObject & SnapMock;
  let metamask: MetaMaskInpageProvider;

  it('should return true if configured properly', async () => {});
});
