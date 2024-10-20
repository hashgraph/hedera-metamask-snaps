/*-
 *
 * Hedera Identify Snap
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/* eslint-disable */
import { MetaMaskInpageProvider } from '@metamask/providers';
import { GoogleToken, IdentitySnapParams } from '../../../src/interfaces';
import { SnapMock } from '../../testUtils/snap.mock';

describe('ConfigureGoogleAccount', () => {
  let identitySnapParams: IdentitySnapParams;
  let googleToken: GoogleToken;
  let snapState: GoogleToken;
  let snapMock: SnapMock;
  let metamask: MetaMaskInpageProvider;

  it('should return true if configured properly', async () => {});
});
