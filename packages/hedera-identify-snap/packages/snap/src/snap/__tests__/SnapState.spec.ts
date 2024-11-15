/*-
 *
 * Hedera Wallet Snap
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

import { SnapState } from '../SnapState';

jest.mock('../../utils/StateUtils', () => ({
  getInitialSnapState: jest.fn(),
}));

jest.mock('../../utils/HederaUtils', () => ({
  getMirrorNodeFlagIfExists: jest.fn(),
}));

describe('getCurrentNetwork', () => {
  it('should request and return the current network chain ID', async () => {
    const mockMetamaskProvider = {
      request: jest.fn().mockResolvedValue('0x1'), // Example chain ID for Ethereum Mainnet
    };
    // @ts-expect-error: likely related to transpilation issues, will fix in that work
    const network = await SnapState.getCurrentNetwork(mockMetamaskProvider);
    expect(network).toBe('0x1');
    expect(mockMetamaskProvider.request).toHaveBeenCalledWith({
      method: 'eth_chainId',
    });
  });
});
