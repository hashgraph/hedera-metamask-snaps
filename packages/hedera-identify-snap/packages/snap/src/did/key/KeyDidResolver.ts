/*
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
import { getAccountStateByCoinType, getState } from '../../snap/state';
import { getCurrentMetamaskAccount } from '../../veramo/accountImport';

export class DidKeyResolver {
  private static startsWithMap: Record<string, (account: string, did: string) => Promise<DIDDocument>> = {
    'did:key:zQ3s': DidKeyResolver.resolveSecp256k1,
  };

  private static async resolveSecp256k1(account: string, did: string): Promise<DIDDocument> {
    const accountState = await getAccountStateByCoinType(await getState(), account);
    const controllerKeyId = `metamask-${account}`;
    const publicKey = accountState.snapKeyStore[controllerKeyId].publicKeyHex;

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
  }

  public static async resolveDidKey(
    didUrl: string,
    parsed: ParsedDID,
    resolver: Resolvable,
    options: DIDResolutionOptions
  ): Promise<DIDResolutionResult> {
    try {
      const account = await getCurrentMetamaskAccount();
      const startsWith = parsed.did.substring(0, 12);
      if (DidKeyResolver.startsWithMap[startsWith] !== undefined) {
        const didDocument = await DidKeyResolver.startsWithMap[startsWith](account, didUrl);
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
  }

  /**
   * Provides a mapping to a did:key resolver, usable by {@link did-resolver#Resolver}.
   *
   * @public
   */
  public static getDidKeyResolver() {
    return { key: DidKeyResolver.resolveDidKey.bind(DidKeyResolver) };
  }
}
