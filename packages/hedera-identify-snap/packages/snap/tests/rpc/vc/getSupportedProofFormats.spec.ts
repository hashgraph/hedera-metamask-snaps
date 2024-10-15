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

import { getSupportedProofFormats } from '../../../src/rpc/vc/getSupportedProofFormats';

describe('GetSupportedProofFormats', () => {
  it('should return all supported proof formats', async () => {
    // get
    const getAvailableMethodsResult = getSupportedProofFormats();
    expect(getAvailableMethodsResult.length).toBe(3);
    expect(getAvailableMethodsResult).toContain('jwt');
    expect(getAvailableMethodsResult).toContain('lds');
    expect(getAvailableMethodsResult).toContain('EthereumEip712Signature2021');

    expect.assertions(4);
  });
});
