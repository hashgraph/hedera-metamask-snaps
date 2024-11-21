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

import { HederaDidResolver } from '@tuum-tech/hedera-did-sdk-js';
import {
  DIDResolutionOptions,
  DIDResolutionResult,
  DIDResolver,
  ParsedDID,
  Resolvable,
} from 'did-resolver';
import { IdentifySnapState } from 'src/types/state';
import { getHcsDidClient } from './hederaDidUtils';

/**
 * Resolves a DID using the HederaDidResolver.
 *
 * @param didUrl - The DID URL to resolve.
 * @param parsed - The parsed DID structure.
 * @param resolver - The Resolvable instance.
 * @param options - DID resolution options.
 * @param state - The IdentifySnapState.
 * @returns A DID resolution result.
 */
export const resolveDidHedera = (state: IdentifySnapState): DIDResolver => {
  return async (
    didUrl: string,
    parsed: ParsedDID,
    _resolver: Resolvable,
    options: DIDResolutionOptions,
  ): Promise<DIDResolutionResult> => {
    const hederaDidClient = await getHcsDidClient(state);
    if (!hederaDidClient) {
      return {
        didDocumentMetadata: {},
        didResolutionMetadata: {
          error: 'invalidDid',
          message: 'HcsDid client is not provided for resolving the DID',
        },
        didDocument: null,
      };
    }

    try {
      const client = hederaDidClient.getClient(); // Retrieve the Hedera client
      const hederaResolver = new HederaDidResolver(client); // Create the resolver
      return await hederaResolver.resolve(didUrl, parsed, _resolver, options); // Resolve the DID
    } catch (err: unknown) {
      return {
        didDocumentMetadata: {},
        didResolutionMetadata: {
          error: 'invalidDid',
          message: (err as Error).message,
        },
        didDocument: null,
      };
    }
  };
};

/**
 * Provides a mapping to a did:hedera resolver, usable by {@link did-resolver#Resolver}.
 *
 * @param state - The IdentifySnapState.
 * @returns A record with the DID method and its resolver.
 * @public
 */
export function getDidHederaResolver(state: IdentifySnapState) {
  return { hedera: resolveDidHedera(state) };
}
