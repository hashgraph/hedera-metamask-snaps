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

import { base58btc } from 'multiformats/bases/base58';

import { addMulticodecPrefix } from '../../utils/formatUtils';
import { getCompressedPublicKey } from '../../utils/keyPair';

export async function getDidKeyIdentifier(publicKey: string): Promise<string> {
  const compressedKey = getCompressedPublicKey(publicKey);

  return Buffer.from(
    base58btc.encode(
      addMulticodecPrefix('secp256k1-pub', Buffer.from(compressedKey, 'hex')),
    ),
  ).toString();
}
