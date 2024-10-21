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

import { ProofFormat } from '@veramo/core';

export const isIn = <T>(values: readonly T[], value: any): value is T => {
  return values.includes(value);
};

export const availableVCStores = ['snap', 'googleDrive'] as const;
export const isValidVCStore = (x: string) => isIn(availableVCStores, x);

export const availableMethods = ['did:pkh'] as const;
export const isValidMethod = (x: string) => isIn(availableMethods, x);

// 60 for ethereum and 3030 for hedera
export const DEFAULTCOINTYPE = 60;
export const HEDERACOINTYPE = 3030;

export const availableProofFormats = [
  'jwt' as ProofFormat,
  'lds' as ProofFormat,
  'EthereumEip712Signature2021' as ProofFormat,
] as const;
export const isValidProofFormat = (x: string) => isIn(availableProofFormats, x);