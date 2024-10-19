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

// Source: https://github.com/multiformats/multicodec/blob/master/table.csv
export type CodecName =
  | 'secp256k1-priv'
  | 'secp256k1-pub'
  | 'ed25519-priv'
  | 'ed25519-pub';

export const MULTICODECS: Record<CodecName, Uint8Array> = {
  'secp256k1-priv': new Uint8Array([129, 38]),
  'secp256k1-pub': new Uint8Array([231, 1]),
  'ed25519-priv': new Uint8Array([128, 38]),
  'ed25519-pub': new Uint8Array([237, 1]),
};
