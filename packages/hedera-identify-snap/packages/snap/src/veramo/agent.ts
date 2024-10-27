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
  createAgent,
  ICredentialIssuer,
  IDataStore,
  IDIDManager,
  IKeyManager,
  IResolver,
  TAgent,
} from '@veramo/core';
import { CredentialIssuerEIP712 } from '@veramo/credential-eip712';

import { CredentialPlugin, W3cMessageHandler } from '@veramo/credential-w3c';
import { JwtMessageHandler } from '@veramo/did-jwt';
import { AbstractIdentifierProvider, DIDManager } from '@veramo/did-manager';
import { getDidPkhResolver, PkhDIDProvider } from '@veramo/did-provider-pkh';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { KeyManager } from '@veramo/key-manager';
import { KeyManagementSystem } from '@veramo/kms-local';
import { MessageHandler } from '@veramo/message-handler';
import { Resolver } from 'did-resolver';
import { DidKeyResolver as keyDidResolver } from '../did/key/KeyDidResolver';
import {
  AbstractDataStore,
  DataManager,
  IDataManager,
} from '../plugins/veramo/verifiable-creds-manager';

import { KeyDidProvider } from '../did/key/KeyDidProvider';
import { IdentitySnapState } from '../interfaces';
import { GoogleDriveVCStore } from '../plugins/veramo/google-drive-data-store';
import {
  SnapDIDStore,
  SnapKeyStore,
  SnapPrivateKeyStore,
  SnapVCStore,
} from '../plugins/veramo/snap-data-store/src/snapDataStore';

export type Agent = TAgent<
  IKeyManager &
    IDIDManager &
    IResolver &
    IDataManager &
    ICredentialIssuer &
    IDataStore
>;

/**
 * Get Veramo agent.
 *
 * @param snap - SnapsGlobalObject.
 * @param state - IdentitySnapState.
 * @returns Agent.
 */
export async function getVeramoAgent(state: IdentitySnapState): Promise<Agent> {
  const didProviders: Record<string, AbstractIdentifierProvider> = {};
  const vcStorePlugins: Record<string, AbstractDataStore> = {};

  didProviders['did:pkh'] = new PkhDIDProvider({ defaultKms: 'snap' });
  didProviders['did:key'] = new KeyDidProvider({ defaultKms: 'snap' });
  vcStorePlugins.snap = new SnapVCStore(state);
  vcStorePlugins.googleDrive = new GoogleDriveVCStore(state);

  const agent = createAgent<
    IKeyManager &
      IDIDManager &
      IResolver &
      IDataManager &
      ICredentialIssuer &
      IDataStore
  >({
    plugins: [
      new KeyManager({
        store: new SnapKeyStore(state),
        kms: {
          snap: new KeyManagementSystem(new SnapPrivateKeyStore(state)),
        },
      }),
      new DIDManager({
        store: new SnapDIDStore(state),
        defaultProvider: 'metamask',
        providers: didProviders,
      }),
      new DIDResolverPlugin({
        resolver: new Resolver({
          ...getDidPkhResolver(),
          ...keyDidResolver.getDidKeyResolver(),
        }),
      }),
      new DataManager({ store: vcStorePlugins }),
      new CredentialPlugin(),
      new CredentialIssuerEIP712(),
      new MessageHandler({
        messageHandlers: [new JwtMessageHandler(), new W3cMessageHandler()],
      }),
    ],
  });

  return agent;
}
