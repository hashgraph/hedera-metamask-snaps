import { SnapsGlobalObject } from '@metamask/snaps-types';
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
import jsonpath from 'jsonpath';
import { v4 as uuidv4 } from 'uuid';
import { IdentitySnapState } from '../../../../interfaces';
import {
  getAccountStateByCoinType,
  getCurrentCoinType,
  updateSnapState,
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
  snap: SnapsGlobalObject;

  state: IdentitySnapState;

  constructor(snap: SnapsGlobalObject, state: IdentitySnapState) {
    super();
    this.snap = snap;
    this.state = state;
  }

  async getKey({ kid }: { kid: string }): Promise<IKey> {
    const account = this.state.currentAccount.evmAddress;
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
    const account = this.state.currentAccount.evmAddress;
    if (!account) {
      throw Error(`SnapKeyStore - Cannot get current account: ${account}`);
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
    if (!accountState.snapKeyStore[kid]) {
      throw Error(`SnapKeyStore - kid '${kid}' not found`);
    }

    const coinType = await getCurrentCoinType();
    delete this.state.accountState[coinType][account].snapKeyStore[kid];
    await updateSnapState(this.snap, this.state);
    return true;
  }

  async importKey(args: IKey) {
    const account = this.state.currentAccount.evmAddress;
    if (!account) {
      throw Error(`SnapKeyStore - Cannot get current account: ${account}`);
    }

    const coinType = await getCurrentCoinType();
    this.state.accountState[coinType][account].snapKeyStore[args.kid] = {
      ...args,
    };
    await updateSnapState(this.snap, this.state);
    return true;
  }

  async listKeys(): Promise<Exclude<IKey, 'privateKeyHex'>[]> {
    const account = this.state.currentAccount.evmAddress;
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
  snap: SnapsGlobalObject;

  state: IdentitySnapState;

  constructor(snap: SnapsGlobalObject, state: IdentitySnapState) {
    super();
    this.snap = snap;
    this.state = state;
  }

  async getKey({ alias }: { alias: string }): Promise<ManagedPrivateKey> {
    const account = this.state.currentAccount.evmAddress;
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
    const account = this.state.currentAccount.evmAddress;
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
    await updateSnapState(this.snap, this.state);
    return true;
  }

  async importKey(args: ImportablePrivateKey) {
    const account = this.state.currentAccount.evmAddress;
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
    await updateSnapState(this.snap, this.state);
    return this.state.accountState[coinType][account].snapPrivateKeyStore[
      alias
    ];
  }

  async listKeys(): Promise<ManagedPrivateKey[]> {
    const account = this.state.currentAccount.evmAddress;
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
  snap: SnapsGlobalObject;

  state: IdentitySnapState;

  constructor(snap: SnapsGlobalObject, state: IdentitySnapState) {
    super();
    this.snap = snap;
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
    const account = this.state.currentAccount.evmAddress;
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
    const account = this.state.currentAccount.evmAddress;
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
    await updateSnapState(this.snap, this.state);
    return true;
  }

  async importDID(args: IIdentifier) {
    const account = this.state.currentAccount.evmAddress;
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
    await updateSnapState(this.snap, this.state);
    return true;
  }

  async listDIDs(args: {
    alias?: string;
    provider?: string;
  }): Promise<IIdentifier[]> {
    const account = this.state.currentAccount.evmAddress;
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
  snap: SnapsGlobalObject;

  state: IdentitySnapState;

  configure: undefined;

  constructor(snap: SnapsGlobalObject, state: IdentitySnapState) {
    super();
    this.snap = snap;
    this.state = state;
  }

  async queryVC(args: IFilterArgs): Promise<IQueryResult[]> {
    const { filter } = args;
    const account = this.state.currentAccount.evmAddress;
    if (!account) {
      throw Error(`SnapVCStore - Cannot get current account: ${account}`);
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
    if (filter && filter.type === 'id') {
      return Object.keys(accountState.vcs)
        .map((k) => {
          let vc = accountState.vcs[k] as unknown;
          if (typeof vc === 'string') {
            vc = decodeJWT(vc);
          }
          return {
            metadata: { id: k },
            data: vc,
          };
        })
        .filter((item: any) => {
          return (
            item.metadata.id === (filter.filter as string) &&
            item.data.credentialSubject.id?.split(':')[4] ===
              this.state.currentAccount.addrToUseForDid
          );
        });
    }

    if (filter && filter.type === 'vcType') {
      return Object.keys(accountState.vcs)
        .map((k) => {
          let vc = accountState.vcs[k] as unknown;
          if (typeof vc === 'string') {
            vc = decodeJWT(vc);
          }
          return {
            metadata: { id: k },
            data: vc,
          };
        })
        .filter((item: any) => {
          return (
            item.data.type?.includes(filter.filter as string) &&
            item.data.credentialSubject.id?.split(':')[4] ===
              this.state.currentAccount.addrToUseForDid
          );
        });
    }

    if (filter === undefined || (filter && filter.type === 'none')) {
      return Object.keys(accountState.vcs)
        .map((k) => {
          let vc = accountState.vcs[k] as unknown;
          if (typeof vc === 'string') {
            vc = decodeJWT(vc);
          }
          return {
            metadata: { id: k },
            data: vc,
          };
        })
        .filter((item: any) => {
          return (
            item.data.credentialSubject.id?.split(':')[4] ===
            this.state.currentAccount.addrToUseForDid
          );
        });
    }

    if (filter && filter.type === 'JSONPath') {
      const objects = Object.keys(accountState.vcs)
        .map((k) => {
          let vc = accountState.vcs[k] as unknown;
          if (typeof vc === 'string') {
            vc = decodeJWT(vc);
          }
          return {
            metadata: { id: k },
            data: vc,
          };
        })
        .filter((item: any) => {
          return (
            item.data.credentialSubject.id?.split(':')[4] ===
            this.state.currentAccount.addrToUseForDid
          );
        });
      const filteredObjects = jsonpath.query(objects, filter.filter as string);
      return filteredObjects as IQueryResult[];
    }
    return [];
  }

  async saveVC(args: { data: ISaveVC[] }): Promise<string[]> {
    const { data: vcs } = args;

    const account = this.state.currentAccount.evmAddress;
    if (!account) {
      throw Error(`SnapVCStore - Cannot get current account: ${account}`);
    }

    const coinType = await getCurrentCoinType();

    const ids: string[] = [];
    for (const vc of vcs) {
      if (
        (vc.vc as VerifiableCredential).credentialSubject.id?.split(':')[4] ===
        this.state.currentAccount.addrToUseForDid
      ) {
        const newId = vc.id || uuidv4();
        ids.push(newId);
        this.state.accountState[coinType][account].vcs[newId] =
          vc.vc as W3CVerifiableCredential;
      }
    }
    await updateSnapState(this.snap, this.state);

    return ids;
  }

  async deleteVC({ id }: { id: string }): Promise<boolean> {
    const account = this.state.currentAccount.evmAddress;
    if (!account) {
      throw Error(`SnapVCStore - Cannot get current account: ${account}`);
    }

    const accountState = await getAccountStateByCoinType(this.state, account);
    if (!accountState.vcs[id]) {
      throw Error(`SnapVCStore - VC ID '${id}' not found`);
    }

    const coinType = await getCurrentCoinType();
    delete this.state.accountState[coinType][account].vcs[id];
    await updateSnapState(this.snap, this.state);
    return true;
  }

  public async clearVCs(_args: IFilterArgs): Promise<boolean> {
    const account = this.state.currentAccount.evmAddress;
    if (!account) {
      throw Error(`SnapVCStore - Cannot get current account: ${account}`);
    }

    const coinType = await getCurrentCoinType();
    this.state.accountState[coinType][account].vcs = {};
    await updateSnapState(this.snap, this.state);
    return true;
  }
}
