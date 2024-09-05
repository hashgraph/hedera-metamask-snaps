// import { IVCManager, VCManager } from '@blockchain-lab-um/veramo-vc-manager';
// import { AbstractVCStore } from '@blockchain-lab-um/veramo-vc-manager/build/vc-store/abstract-vc-store';
import { contexts as credential_contexts } from '@transmute/credentials-context';
import {
  createAgent,
  IAgentOptions,
  ICredentialPlugin,
  IDataStore,
  IDIDManager,
  IKeyManager,
  IMessageHandler,
  IResolver,
  TAgent
} from '@veramo/core';
import {
  CredentialIssuerEIP712,
  ICredentialIssuerEIP712
} from '@veramo/credential-eip712';
import {
  CredentialIssuerLD,
  ICredentialIssuerLD,
  LdDefaultContexts,
  VeramoEcdsaSecp256k1RecoverySignature2020,
  VeramoEd25519Signature2018
} from '@veramo/credential-ld';
import { CredentialPlugin, W3cMessageHandler } from '@veramo/credential-w3c';
import {
  DataStoreJson,
  DIDStoreJson,
  KeyStoreJson,
  PrivateKeyStoreJson
} from '@veramo/data-store-json';
import { DIDComm, DIDCommMessageHandler, IDIDComm } from '@veramo/did-comm';
import { JwtMessageHandler } from '@veramo/did-jwt';
import { DIDManager } from '@veramo/did-manager';
import { getDidKeyResolver, KeyDIDProvider } from '@veramo/did-provider-key';
import { getDidPkhResolver, PkhDIDProvider } from '@veramo/did-provider-pkh';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { KeyManager } from '@veramo/key-manager';
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local';
import { Web3KeyManagementSystem } from '@veramo/kms-web3';
import { MessageHandler } from '@veramo/message-handler';
import {
  ISelectiveDisclosure,
  SdrMessageHandler,
  SelectiveDisclosure
} from '@veramo/selective-disclosure';
import console from 'console';
import { Resolver } from 'did-resolver';
import { JsonFileStore } from './utils/json-file-store';

let databaseFile: string;
const secretKey =
  '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c';

let agent: TAgent<
    IDIDManager &
    IKeyManager &
    IDataStore &
    IResolver &
    IMessageHandler &
    IDIDComm &
    ICredentialPlugin &
    ICredentialIssuerLD &
    ICredentialIssuerEIP712 &
    ISelectiveDisclosure
>;

export const getAgent = async () => {
  await setup();
  return agent;
};

export const setupAgent = async () => {
  console.log('Setup');
  await setup();
};

/* eslint-disable */
const setup = async (options?: IAgentOptions): Promise<boolean> => {
  // This test suite uses a plain JSON file for storage for each agent created.
  // It is important that the same object be used for `DIDStoreJson`/`KeyStoreJson`
  // and `DataStoreJson` if you want to use all the query capabilities of `DataStoreJson`
  var fs = require('fs');
  var localStorageFolder = './tmp';

if (!fs.existsSync(localStorageFolder)){
    fs.mkdirSync(localStorageFolder);
}
  databaseFile = options?.context?.databaseFile || `${localStorageFolder}/local-database-${Math.random().toPrecision(5)}.json`

  const jsonFileStore = await JsonFileStore.fromFile(databaseFile)

  agent = createAgent<
      IDIDManager &
      IKeyManager &
      IDataStore &
      IResolver &
      IMessageHandler &
      IDIDComm &
      ICredentialPlugin &
      ICredentialIssuerLD &
      ICredentialIssuerEIP712 &
      ISelectiveDisclosure
  >({
    ...options,
    context: {
      // authorizedDID: 'did:example:3456'
    },
    plugins: [
      new KeyManager({
        store: new KeyStoreJson(jsonFileStore),
        kms: {
          local: new KeyManagementSystem(new PrivateKeyStoreJson(jsonFileStore, new SecretBox(secretKey))),
          web3: new Web3KeyManagementSystem({}),
        },
      }),
      new DIDManager({
        store: new DIDStoreJson(jsonFileStore),
        defaultProvider: 'did:ethr:goerli',
        providers: {
          'did:key': new KeyDIDProvider({
            defaultKms: 'local',
          }),
          'did:pkh': new PkhDIDProvider({
            defaultKms: 'local',
          })
        },
      }),
      new DIDResolverPlugin({
        resolver: new Resolver({
          ...getDidKeyResolver(),
          ...getDidPkhResolver()
        }),
      }),
      new DataStoreJson(jsonFileStore),
      new MessageHandler({
        messageHandlers: [
          new DIDCommMessageHandler(),
          new JwtMessageHandler(),
          new W3cMessageHandler(),
          new SdrMessageHandler(),
        ],
      }),
      new DIDComm(),
      new CredentialPlugin(),
      new CredentialIssuerEIP712(),
      new CredentialIssuerLD({
        contextMaps: [LdDefaultContexts, credential_contexts as any],
        suites: [new VeramoEcdsaSecp256k1RecoverySignature2020(), new VeramoEd25519Signature2018()],
      }),
      new SelectiveDisclosure(),
      ...(options?.plugins || []),
    ],
  })
  return true
}