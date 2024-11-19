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
  IIdentifier,
  IKey,
  VerifiableCredential,
  W3CVerifiableCredential,
} from '@veramo/core';
import { AbstractDIDStore } from '@veramo/did-manager';
import {
  AbstractKeyStore,
  AbstractPrivateKeyStore,
  ImportablePrivateKey,
  ManagedPrivateKey,
} from '@veramo/key-manager';
import { sha256 } from 'js-sha256';
import jsonpath from 'jsonpath';
import { v4 as uuidv4 } from 'uuid';
import { getDidKeyIdentifier } from '../../../../did/key/keyDidUtils';
import { SnapState } from '../../../../snap/SnapState';
import { IdentifySnapState } from '../../../../types/state';
import { decodeJWT } from '../../google-drive-data-store';
import {
  AbstractDataStore,
  IFilterArgs,
  IQueryResult,
  ISaveVC,
} from '../../verifiable-creds-manager';

/**
 * An implementation of {@link AbstractKeyStore} that holds everything in snap state.
 *
 * This is usable by {@link @veramo/kms-local} to hold the key data.
 */
export class SnapKeyStore extends AbstractKeyStore {
  state: IdentifySnapState;

  constructor(state: IdentifySnapState) {
    super();
    this.state = state;
  }

  async getKey({ kid }: { kid: string }): Promise<IKey> {
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];
    const key = accountState.snapKeyStore[kid];
    if (!key) {
      throw Error(`SnapKeyStore - kid '${kid}' not found`);
    }
    return key;
  }

  async deleteKey({ kid }: { kid: string }) {
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];
    if (!accountState.snapKeyStore[kid]) {
      throw Error(`SnapKeyStore - kid '${kid}' not found`);
    }

    delete this.state.accountState[this.state.currentAccount.snapEvmAddress][
      this.state.currentAccount.network
    ].snapKeyStore[kid];
    await SnapState.updateState(this.state);
    return true;
  }

  async importKey(args: IKey) {
    this.state.accountState[this.state.currentAccount.snapEvmAddress][
      this.state.currentAccount.network
    ].snapKeyStore[args.kid] = {
      ...args,
    };
    await SnapState.updateState(this.state);
    return true;
  }

  async listKeys(): Promise<Exclude<IKey, 'privateKeyHex'>[]> {
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];
    const safeKeys = Object.values(accountState.snapKeyStore).map((key) => {
      const { privateKeyHex, ...safeKey } = key;
      return safeKey;
    });
    return safeKeys;
  }
}

/**
 * An implementation of {@link AbstractPrivateKeyStore} that holds everything in snap state.
 *
 * This is usable by {@link @veramo/kms-local} to hold the key data.
 */
export class SnapPrivateKeyStore extends AbstractPrivateKeyStore {
  state: IdentifySnapState;

  constructor(state: IdentifySnapState) {
    super();
    this.state = state;
  }

  async getKey({ alias }: { alias: string }): Promise<ManagedPrivateKey> {
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];
    const key = accountState.snapPrivateKeyStore[alias];
    if (!key) {
      throw Error(
        `SnapPrivateKeyStore - not_found: PrivateKey not found for alias=${alias}`,
      );
    }
    return key;
  }

  async deleteKey({ alias }: { alias: string }) {
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];
    if (!accountState.snapPrivateKeyStore[alias]) {
      throw Error('SnapPrivateKeyStore - Key not found');
    }

    delete this.state.accountState[this.state.currentAccount.snapEvmAddress][
      this.state.currentAccount.network
    ].snapPrivateKeyStore[alias];
    await SnapState.updateState(this.state);
    return true;
  }

  async importKey(args: ImportablePrivateKey) {
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];

    const alias = args.alias || uuidv4();
    const existingEntry = accountState.snapPrivateKeyStore[alias];
    if (existingEntry && existingEntry.privateKeyHex !== args.privateKeyHex) {
      console.error(
        'SnapPrivateKeyStore - key_already_exists: key exists with different data, please use a different alias',
      );
      throw new Error(
        'SnapPrivateKeyStore - key_already_exists: key exists with different data, please use a different alias',
      );
    }

    this.state.accountState[this.state.currentAccount.snapEvmAddress][
      this.state.currentAccount.network
    ].snapPrivateKeyStore[alias] = {
      ...args,
      alias,
    };
    await SnapState.updateState(this.state);
    return this.state.accountState[this.state.currentAccount.snapEvmAddress][
      this.state.currentAccount.network
    ].snapPrivateKeyStore[alias];
  }

  async listKeys(): Promise<ManagedPrivateKey[]> {
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];
    return [...Object.values(accountState.snapPrivateKeyStore)];
  }
}

/**
 * An implementation of {@link AbstractDIDStore} that holds everything in snap state.
 *
 * This is usable by {@link @veramo/did-manager} to hold the did key data.
 */
export class SnapDIDStore extends AbstractDIDStore {
  state: IdentifySnapState;

  constructor(state: IdentifySnapState) {
    super();
    this.state = state;
  }

  async getDID({
    did,
    alias,
    provider,
  }: {
    did: string;
    alias: string;
    provider: string;
  }): Promise<IIdentifier> {
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];
    const { identifiers } = accountState;

    if (did && !alias) {
      if (!identifiers[did]) {
        throw Error(
          `SnapDIDStore - not_found: IIdentifier not found with did=${did}`,
        );
      }
      return identifiers[did];
    } else if (!did && alias && provider) {
      for (const key of Object.keys(identifiers)) {
        if (
          identifiers[key].alias === alias &&
          identifiers[key].provider === provider
        ) {
          return identifiers[key];
        }
      }
    } else {
      throw Error(
        'SnapDIDStore - invalid_argument: Get requires did or (alias and provider)',
      );
    }
    throw Error(
      `SnapDIDStore - not_found: IIdentifier not found with alias=${alias} provider=${provider}`,
    );
  }

  async deleteDID({ did }: { did: string }) {
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];
    if (!accountState.identifiers[did]) {
      throw Error(
        `SnapDIDStore - not_found: IIdentifier not found with did=${did}`,
      );
    }

    delete this.state.accountState[this.state.currentAccount.snapEvmAddress][
      this.state.currentAccount.network
    ].identifiers[did];
    await SnapState.updateState(this.state);
    return true;
  }

  async importDID(args: IIdentifier) {
    const identifier = { ...args };
    for (const key of identifier.keys) {
      if ('privateKeyHex' in key) {
        delete key.privateKeyHex;
      }
    }

    this.state.accountState[this.state.currentAccount.snapEvmAddress][
      this.state.currentAccount.network
    ].identifiers[args.did] = identifier;
    await SnapState.updateState(this.state);
    return true;
  }

  async listDIDs(args: {
    alias?: string;
    provider?: string;
  }): Promise<IIdentifier[]> {
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];
    let result: IIdentifier[] = [];
    for (const key of Object.keys(accountState.identifiers)) {
      result.push(accountState.identifiers[key]);
    }

    if (args.alias && !args.provider) {
      result = result.filter((i) => i.alias === args.alias);
    } else if (args.provider && !args.alias) {
      result = result.filter((i) => i.provider === args.provider);
    } else if (args.provider && args.alias) {
      result = result.filter(
        (i) => i.provider === args.provider && i.alias === args.alias,
      );
    }

    return result;
  }
}

/**
 * An implementation of {@link AbstractDataStore} that holds everything in snap state.
 *
 * This is usable by {@link @vc-manager/VCManager} to hold the vc data
 */
export class SnapVCStore extends AbstractDataStore {
  state: IdentifySnapState;

  configure: undefined;

  constructor(state: IdentifySnapState) {
    super();
    this.state = state;
  }

  async queryVC(args: IFilterArgs): Promise<IQueryResult[]> {
    const { filter } = args;
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];
    const currentMethod = this.state.currentAccount.method;

    // Helper function to decode VC if it's in JWT format
    const decodeVC = (k: string) => {
      let vc = accountState.vcs[k] as unknown;
      if (typeof vc === 'string') {
        vc = decodeJWT(vc);
      }
      return { metadata: { id: k }, data: vc };
    };

    // Helper function to filter VCs by the current DID method
    const filterByMethod = (vc: any) => {
      const vcId = vc.data.credentialSubject.id || '';
      return vcId.startsWith(currentMethod); // Only return if VC matches the current method (e.g., 'did:key')
    };

    // Step 1: Decode all VCs and filter them by method upfront
    const filteredVCs = Object.keys(accountState.vcs)
      .map(decodeVC)
      .filter(filterByMethod); // Only VCs matching the current DID method are kept

    // Step 2: Apply additional filters based on the `args.filter`
    if (filter && filter.type === 'id') {
      return filteredVCs.filter((item) => item.metadata.id === filter.filter);
    }

    if (filter && filter.type === 'vcType') {
      return filteredVCs.filter((item) =>
        (item.data as VerifiableCredential).type?.includes(filter.filter),
      );
    }

    if (filter === undefined || (filter && filter.type === 'none')) {
      return filteredVCs;
    }

    if (filter && filter.type === 'JSONPath') {
      const filteredObjects = jsonpath.query(
        filteredVCs,
        filter.filter as string,
      );
      return filteredObjects as IQueryResult[];
    }

    return [];
  }

  async saveVC(args: { data: ISaveVC[] }): Promise<string[]> {
    const { data: vcs } = args;
    const currentMethod = this.state.currentAccount.method;

    const ids: string[] = [];

    for (const vc of vcs) {
      let identifier = this.state.currentAccount.snapEvmAddress;
      if (currentMethod === 'did:key') {
        identifier = await getDidKeyIdentifier(
          this.state.currentAccount.publicKey,
        );
      }

      // Save only if the VC matches the current DID method
      const vcId = (vc.vc as VerifiableCredential).credentialSubject.id || '';
      if (
        vcId.startsWith(currentMethod) &&
        vcId.split(':').pop() === identifier
      ) {
        const newId = vc.id || sha256(JSON.stringify(vc));
        ids.push(newId);
        this.state.accountState[this.state.currentAccount.snapEvmAddress][
          this.state.currentAccount.network
        ].vcs[newId] = vc.vc as W3CVerifiableCredential;
      }
    }

    await SnapState.updateState(this.state);
    return ids;
  }

  async deleteVC({ id }: { id: string }): Promise<boolean> {
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];

    // Ensure VC exists and matches the current DID method
    const currentMethod = this.state.currentAccount.method;
    let identifier = this.state.currentAccount.snapEvmAddress;
    if (currentMethod === 'did:key') {
      identifier = await getDidKeyIdentifier(
        this.state.currentAccount.publicKey,
      );
    }

    const vcId =
      (accountState.vcs[id] as VerifiableCredential).credentialSubject.id || '';
    if (
      !vcId.startsWith(currentMethod) ||
      vcId.split(':').pop() !== identifier
    ) {
      console.log(
        `SnapVCStore - VC ID '${id}' does not match the current account.`,
      );
      return false;
    }

    delete this.state.accountState[this.state.currentAccount.snapEvmAddress][
      this.state.currentAccount.network
    ].vcs[id];

    await SnapState.updateState(this.state);
    return true;
  }

  public async clearVCs(_args: IFilterArgs): Promise<boolean> {
    const accountState =
      this.state.accountState[this.state.currentAccount.snapEvmAddress][
        this.state.currentAccount.network
      ];

    const currentMethod = this.state.currentAccount.method;

    // Ensure vc is correctly typed with a conditional check
    const { vcs } = accountState;

    this.state.accountState[this.state.currentAccount.snapEvmAddress][
      this.state.currentAccount.network
    ].vcs = Object.fromEntries(
      Object.entries(vcs).filter(([_, vc]) => {
        return (
          vc && // Check vc exists
          typeof vc === 'object' && // Ensure vc is an object
          'credentialSubject' in vc && // Ensure credentialSubject exists
          vc.credentialSubject?.id?.startsWith(currentMethod) === false // Filter based on DID method
        );
      }),
    );

    await SnapState.updateState(this.state);
    return true;
  }
}
