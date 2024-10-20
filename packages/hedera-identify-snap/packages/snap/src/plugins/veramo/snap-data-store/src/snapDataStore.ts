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
import { IdentitySnapState } from '../../../../interfaces';
import {
  getAccountStateByCoinType,
  getCurrentCoinType,
  updateState,
} from '../../../../snap/state';
import { decodeJWT } from '../../../../utils/jwt';
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
  state: IdentitySnapState;

  constructor(state: IdentitySnapState) {
    super();
    this.state = state;
  }

  async getKey({ kid }: { kid: string }): Promise<IKey> {
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(`SnapKeyStore - Cannot get current account: ${account}`);
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
    const key = accountState.snapKeyStore[kid];
    if (!key) {
      throw Error(`SnapKeyStore - kid '${kid}' not found`);
    }
    return key;
  }

  async deleteKey({ kid }: { kid: string }) {
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(`SnapKeyStore - Cannot get current account: ${account}`);
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
    if (!accountState.snapKeyStore[kid]) {
      throw Error(`SnapKeyStore - kid '${kid}' not found`);
    }

    const coinType = await getCurrentCoinType();
    delete this.state.accountState[coinType][account].snapKeyStore[kid];
    await updateState(this.state);
    return true;
  }

  async importKey(args: IKey) {
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(`SnapKeyStore - Cannot get current account: ${account}`);
    }

    const coinType = await getCurrentCoinType();
    this.state.accountState[coinType][account].snapKeyStore[args.kid] = {
      ...args,
    };
    await updateState(this.state);
    return true;
  }

  async listKeys(): Promise<Exclude<IKey, 'privateKeyHex'>[]> {
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(`SnapKeyStore - Cannot get current account: ${account}`);
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
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
  state: IdentitySnapState;

  constructor(state: IdentitySnapState) {
    super();
    this.state = state;
  }

  async getKey({ alias }: { alias: string }): Promise<ManagedPrivateKey> {
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(
        `SnapPrivateKeyStore - Cannot get current account: ${account}`,
      );
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
    const key = accountState.snapPrivateKeyStore[alias];
    if (!key) {
      throw Error(
        `SnapPrivateKeyStore - not_found: PrivateKey not found for alias=${alias}`,
      );
    }
    return key;
  }

  async deleteKey({ alias }: { alias: string }) {
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(
        `SnapPrivateKeyStore - Cannot get current account: ${account}`,
      );
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
    if (!accountState.snapPrivateKeyStore[alias]) {
      throw Error('SnapPrivateKeyStore - Key not found');
    }

    const coinType = await getCurrentCoinType();
    delete this.state.accountState[coinType][account].snapPrivateKeyStore[
      alias
    ];
    await updateState(this.state);
    return true;
  }

  async importKey(args: ImportablePrivateKey) {
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(
        `SnapPrivateKeyStore - Cannot get current account: ${account}`,
      );
    }

    const alias = args.alias || uuidv4();
    const accountState = await getAccountStateByCoinType(this.state, account);
    const existingEntry = accountState.snapPrivateKeyStore[alias];
    if (existingEntry && existingEntry.privateKeyHex !== args.privateKeyHex) {
      console.error(
        'SnapPrivateKeyStore - key_already_exists: key exists with different data, please use a different alias',
      );
      throw new Error(
        'SnapPrivateKeyStore - key_already_exists: key exists with different data, please use a different alias',
      );
    }

    const coinType = await getCurrentCoinType();
    this.state.accountState[coinType][account].snapPrivateKeyStore[alias] = {
      ...args,
      alias,
    };
    await updateState(this.state);
    return this.state.accountState[coinType][account].snapPrivateKeyStore[
      alias
    ];
  }

  async listKeys(): Promise<ManagedPrivateKey[]> {
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(
        `SnapPrivateKeyStore - Cannot get current account: ${account}`,
      );
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
    return [...Object.values(accountState.snapPrivateKeyStore)];
  }
}

/**
 * An implementation of {@link AbstractDIDStore} that holds everything in snap state.
 *
 * This is usable by {@link @veramo/did-manager} to hold the did key data.
 */
export class SnapDIDStore extends AbstractDIDStore {
  state: IdentitySnapState;

  constructor(state: IdentitySnapState) {
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
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(`SnapDIDStore - Cannot get current account: ${account}`);
    }
    const { identifiers } = await getAccountStateByCoinType(
      this.state,
      account,
    );

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
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(`SnapDIDStore - Cannot get current account: ${account}`);
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
    if (!accountState.identifiers[did]) {
      throw Error(
        `SnapDIDStore - not_found: IIdentifier not found with did=${did}`,
      );
    }

    const coinType = await getCurrentCoinType();
    delete this.state.accountState[coinType][account].identifiers[did];
    await updateState(this.state);
    return true;
  }

  async importDID(args: IIdentifier) {
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(`SnapDIDStore - Cannot get current account: ${account}`);
    }

    const identifier = { ...args };
    for (const key of identifier.keys) {
      if ('privateKeyHex' in key) {
        delete key.privateKeyHex;
      }
    }

    const coinType = await getCurrentCoinType();
    console.log('account: ', account, ' did: ', args.did);
    this.state.accountState[coinType][account].identifiers[args.did] =
      identifier;
    await updateState(this.state);
    return true;
  }

  async listDIDs(args: {
    alias?: string;
    provider?: string;
  }): Promise<IIdentifier[]> {
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(`SnapDIDStore - Cannot get current account: ${account}`);
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
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
  state: IdentitySnapState;

  configure: undefined;

  constructor(state: IdentitySnapState) {
    super();
    this.state = state;
  }

  async queryVC(args: IFilterArgs): Promise<IQueryResult[]> {
    const { filter } = args;
    const account = this.state.currentAccount.metamaskAddress;
    if (!account) {
      throw Error(`SnapVCStore - Cannot get current account: ${account}`);
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
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
    const account = this.state.currentAccount.metamaskAddress;

    if (!account) {
      throw Error(`SnapVCStore - Cannot get current account: ${account}`);
    }

    const coinType = await getCurrentCoinType();
    const currentMethod = this.state.currentAccount.method; // 'did:key' or 'did:pkh'

    const ids: string[] = [];

    for (const vc of vcs) {
      let identifier = this.state.currentAccount.snapAddress;
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
        this.state.accountState[coinType][account].vcs[newId] =
          vc.vc as W3CVerifiableCredential;
      }
    }

    await updateState(this.state);
    return ids;
  }

  async deleteVC({ id }: { id: string }): Promise<boolean> {
    const account = this.state.currentAccount.metamaskAddress;

    if (!account) {
      throw Error(`SnapVCStore - Cannot get current account: ${account}`);
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
    const coinType = await getCurrentCoinType();

    // Ensure VC exists and matches the current DID method
    const currentMethod = this.state.currentAccount.method;
    let identifier = this.state.currentAccount.snapAddress;
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

    delete this.state.accountState[coinType][account].vcs[id];
    await updateState(this.state);

    return true;
  }

  public async clearVCs(_args: IFilterArgs): Promise<boolean> {
    const account = this.state.currentAccount.metamaskAddress;

    if (!account) {
      throw Error(`SnapVCStore - Cannot get current account: ${account}`);
    }

    const coinType = await getCurrentCoinType();
    const currentMethod = this.state.currentAccount.method;

    // Ensure vc is correctly typed with a conditional check
    const accountVCs = this.state.accountState[coinType][account].vcs;
    this.state.accountState[coinType][account].vcs = Object.fromEntries(
      Object.entries(accountVCs).filter(([_, vc]) => {
        return (
          vc && // Check vc exists
          typeof vc === 'object' && // Ensure vc is an object
          'credentialSubject' in vc && // Ensure credentialSubject exists
          vc.credentialSubject?.id?.startsWith(currentMethod) === false // Filter based on DID method
        );
      }),
    );

    await updateState(this.state);
    return true;
  }
}
