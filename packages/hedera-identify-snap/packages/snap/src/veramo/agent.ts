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

import { SnapsGlobalObject } from '@metamask/snaps-types';
import { CredentialPlugin, W3cMessageHandler } from '@veramo/credential-w3c';
import { JwtMessageHandler } from '@veramo/did-jwt';
import { AbstractIdentifierProvider, DIDManager } from '@veramo/did-manager';
import { getDidPkhResolver, PkhDIDProvider } from '@veramo/did-provider-pkh';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { KeyManager } from '@veramo/key-manager';
import { KeyManagementSystem } from '@veramo/kms-local';
import { MessageHandler } from '@veramo/message-handler';
import { SdrMessageHandler } from '@veramo/selective-disclosure';
import { Resolver } from 'did-resolver';
import {
  AbstractDataStore,
  DataManager,
  IDataManager,
} from '../plugins/veramo/verifiable-creds-manager';

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
export async function getVeramoAgent(
  snap: SnapsGlobalObject,
  state: IdentitySnapState,
): Promise<Agent> {
  const didProviders: Record<string, AbstractIdentifierProvider> = {};
  const vcStorePlugins: Record<string, AbstractDataStore> = {};

  didProviders['did:pkh'] = new PkhDIDProvider({ defaultKms: 'snap' });
  vcStorePlugins.snap = new SnapVCStore(snap, state);
  vcStorePlugins.googleDrive = new GoogleDriveVCStore(snap, state);

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
        store: new SnapKeyStore(snap, state),
        kms: {
          snap: new KeyManagementSystem(new SnapPrivateKeyStore(snap, state)),
        },
      }),
      new DIDManager({
        store: new SnapDIDStore(snap, state),
        defaultProvider: 'metamask',
        providers: didProviders,
      }),
      new DIDResolverPlugin({
        resolver: new Resolver({
          ...getDidPkhResolver(),
        }),
      }),
      new DataManager({ store: vcStorePlugins }),
      new CredentialPlugin(),
      new CredentialIssuerEIP712(),
      /*  new CredentialIssuerLD({
        contextMaps: [LdDefaultContexts],
        suites: [new VeramoEcdsaSecp256k1RecoverySignature2020()],
      }), */
      new MessageHandler({
        messageHandlers: [
          new JwtMessageHandler(),
          new W3cMessageHandler(),
          new SdrMessageHandler(),
        ],
      }),
    ],
  });

  return agent;
}
