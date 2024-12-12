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
import { SnapState } from '../../snap/SnapState';
import { getHederaClient } from './hederaDidUtils';

enum SupportedVerificationMethods {
  'JsonWebKey2020',
  'EcdsaSecp256k1VerificationKey2020',
  'Ed25519VerificationKey2020',
}

export type DIDHederaResolverOptions = DIDResolutionOptions & {
  publicKeyFormat?: keyof typeof SupportedVerificationMethods; // defaults to 'JsonWebKey2020'
};

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
export const resolveDidHedera: DIDResolver = async (
  didUrl: string,
  parsed: ParsedDID,
  resolver: Resolvable,
  options: DIDHederaResolverOptions,
): Promise<DIDResolutionResult> => {
  try {
    const state = await SnapState.getState();
    const hederaClient = await getHederaClient(state);
    if (!hederaClient) {
      return {
        didDocumentMetadata: {},
        didResolutionMetadata: {
          error: 'invalidDid',
          message: 'Hedera client is not provided for resolving the DID',
        },
        didDocument: null,
      };
    }
    const client = hederaClient.getClient(); // Retrieve the Hedera client
    const hederaResolver = new HederaDidResolver(client); // Create the resolver
    options.publicKeyFormat = options.publicKeyFormat || 'JsonWebKey2020';
    return await hederaResolver.resolve(didUrl, parsed, resolver, options); // Resolve the DID
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

/**
 * Provides a mapping to a did:hedera resolver, usable by {@link did-resolver#Resolver}.
 *
 * @param state - The IdentifySnapState.
 * @returns A record with the DID method and its resolver.
 * @public
 */
export function getDidHederaResolver() {
  return { hedera: resolveDidHedera };
}
