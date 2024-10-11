/* eslint-disable */
import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { IdentitySnapParams, IdentitySnapState } from '../../../src/interfaces';
import { SnapMock } from '../../testUtils/snap.mock';

describe('ConnectHederaAccount', () => {
  let identitySnapParams: IdentitySnapParams;
  let snapState: IdentitySnapState;
  let snapMock: SnapsGlobalObject & SnapMock;
  let metamask: MetaMaskInpageProvider;
  let accountId: '0.0.15215';

  it('should return true', async () => {});
});
