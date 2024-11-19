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

import {
  DIDDocument,
  DIDResolutionOptions,
  DIDResolutionResult,
  DIDResolver,
  ParsedDID,
  Resolvable,
} from 'did-resolver';
import { SnapState } from '../../snap/SnapState';

export const resolveSecp256k1 = async (did: string): Promise<DIDDocument> => {
  const state = await SnapState.getState();
  const publicKey = state.currentAccount.publicKey;

  // TODO: Change id ?
  const didDocument: DIDDocument = {
    id: `did:key:${did}#${did}`,
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/secp256k1-2019/v1',
    ],
    assertionMethod: [`did:key:${did}#${did}`],
    authentication: [`did:key:${did}#${did}`],
    capabilityInvocation: [`did:key:${did}#${did}`],
    capabilityDelegation: [`did:key:${did}#${did}`],
    keyAgreement: [`did:key:${did}#${did}`],
    verificationMethod: [
      {
        id: `did:key:${did}#${did}`,
        type: 'EcdsaSecp256k1RecoveryMethod2020',
        controller: `did:key:${did}#${did}`,
        publicKeyHex: publicKey.split('0x')[1],
      },
    ],
  };
  return didDocument;
};

type ResolutionFunction = (
  account: string,
  did: string,
) => Promise<DIDDocument>;

const startsWithMap: Record<string, ResolutionFunction> = {
  'did:key:zQ3s': resolveSecp256k1,
};

export const resolveDidHedera: DIDResolver = async (
  didUrl: string,
  parsed: ParsedDID,
  resolver: Resolvable,
  options: DIDResolutionOptions,
): Promise<DIDResolutionResult> => {
  try {
    const state = await SnapState.getState();
    const account = state.currentAccount.snapEvmAddress;
    const startsWith = parsed.did.substring(0, 12);
    if (startsWithMap[startsWith] !== undefined) {
      const didDocument = await startsWithMap[startsWith](account, didUrl);
      return {
        didDocumentMetadata: {},
        didResolutionMetadata: {},
        didDocument,
      } as DIDResolutionResult;
    }

    return {
      didDocumentMetadata: {},
      didResolutionMetadata: {
        error: 'invalidDid',
        message: 'unsupported key type for did:key',
      },
      didDocument: null,
    };
  } catch (err: unknown) {
    return {
      didDocumentMetadata: {},
      didResolutionMetadata: {
        error: 'invalidDid',
        message: (err as string).toString(),
      },
      didDocument: null,
    };
  }
};

/**
 * Provides a mapping to a did:hedera resolver, usable by {@link did-resolver#Resolver}.
 *
 * @public
 */
export function getDidHederaResolver() {
  return { hedera: resolveDidHedera };
}
