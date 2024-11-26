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
  ICredentialPlugin,
  IDataStore,
  IDIDManager,
  IKeyManager,
  IResolver,
  TAgent,
} from '@veramo/core';

import { CredentialPlugin, W3cMessageHandler } from '@veramo/credential-w3c';
import { JwtMessageHandler } from '@veramo/did-jwt';
import { AbstractIdentifierProvider, DIDManager } from '@veramo/did-manager';
import { getDidPkhResolver, PkhDIDProvider } from '@veramo/did-provider-pkh';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { KeyManager } from '@veramo/key-manager';
import { KeyManagementSystem } from '@veramo/kms-local';
import { MessageHandler } from '@veramo/message-handler';
import { Resolver } from 'did-resolver';
import { getDidHederaResolver } from '../did/hedera/hederaDidResolver';

import {
  AbstractDataStore,
  DataManager,
  IDataManager,
} from '../plugins/veramo/verifiable-creds-manager';

import { getDidKeyResolver, KeyDIDProvider } from '@veramo/did-provider-key';
import { HederaDIDProvider } from '../did/hedera/hederaDidProvider';
import { GoogleDriveVCStore } from '../plugins/veramo/google-drive-data-store';
import {
  SnapDIDStore,
  SnapKeyStore,
  SnapPrivateKeyStore,
  SnapVCStore,
} from '../plugins/veramo/snap-data-store/src/snapDataStore';
import { IdentifySnapState } from '../types/state';

export type Agent = TAgent<
  IKeyManager &
    IDIDManager &
    IResolver &
    IDataManager &
    ICredentialPlugin &
    IDataStore
>;

/**
 * Get Veramo agent.
 *
 * @param snap - SnapsGlobalObject.
 * @param state - IdentitySnapState.
 * @returns Agent.
 */
export async function getVeramoAgent(state: IdentifySnapState): Promise<Agent> {
  const didProviders: Record<string, AbstractIdentifierProvider> = {};
  const vcStorePlugins: Record<string, AbstractDataStore> = {};

  // Initialize DID providers
  didProviders['did:pkh'] = new PkhDIDProvider({ defaultKms: 'snap' });
  didProviders['did:key'] = new KeyDIDProvider({ defaultKms: 'snap' });
  // Prepare the resolver map dynamically
  const resolverMap = {
    ...getDidPkhResolver(),
    ...getDidKeyResolver(),
  };

  if (state.snapConfig.dApp.didMethod === 'did:hedera') {
    didProviders['did:hedera'] = await HederaDIDProvider.createWithState({
      defaultKms: 'snap',
      state: state,
    });
    Object.assign(resolverMap, getDidHederaResolver());
  }

  // Initialize VC store plugins
  vcStorePlugins.snap = new SnapVCStore(state);
  vcStorePlugins.googleDrive = new GoogleDriveVCStore(state);

  const agent = createAgent<
    IKeyManager &
      IDIDManager &
      IResolver &
      IDataManager &
      ICredentialPlugin &
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
        defaultProvider: 'did:pkh',
        providers: didProviders,
      }),
      new DIDResolverPlugin({
        resolver: new Resolver(resolverMap),
      }),
      new DataManager({ store: vcStorePlugins }),
      new CredentialPlugin(),
      new MessageHandler({
        messageHandlers: [new JwtMessageHandler(), new W3cMessageHandler()],
      }),
    ],
  });

  return agent;
}
