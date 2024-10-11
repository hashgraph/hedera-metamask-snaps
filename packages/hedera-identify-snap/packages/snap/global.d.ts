/* eslint-disable */

import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';

declare global {
  let ethereum: MetaMaskInpageProvider;
  let snap: SnapsGlobalObject;
}
