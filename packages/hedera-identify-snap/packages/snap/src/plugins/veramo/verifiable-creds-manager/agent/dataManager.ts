import { IAgentPlugin } from '@veramo/core';
import { AbstractDataStore } from '../data-store/abstractDataStore';
import {
  IDataManager,
  IDataManagerClearArgs,
  IDataManagerClearResult,
  IDataManagerDeleteArgs,
  IDataManagerDeleteResult,
  IDataManagerQueryArgs,
  IDataManagerQueryResult,
  IDataManagerSaveArgs,
  IDataManagerSaveResult,
} from '../types/IDataManager';

export class DataManager implements IAgentPlugin {
  readonly methods: IDataManager = {
    saveVC: this.saveVC.bind(this),
    queryVC: this.queryVC.bind(this),
    deleteVC: this.deleteVC.bind(this),
    clearVCs: this.clearVCs.bind(this),
  };

  private stores: Record<string, AbstractDataStore>;

  constructor(options: { store: Record<string, AbstractDataStore> }) {
    this.stores = options.store;
  }

  /**
   * Check if any stores require token configuration.
   *
   * @param store - Input stores.
   * @param accessToken - Access token.
   * @returns The result to check token configuration.
   */
  private async checkTokenConfiguration(
    store: string[],
    accessToken: string | undefined,
  ) {
    for (const storeName of store) {
      const storePlugin = this.stores[storeName];
      if (!storePlugin) {
        throw new Error(`Store plugin ${storeName} not found`);
      }

      if (storePlugin.configure) {
        if (!accessToken) {
          throw new Error('You need to configure google account.');
        }
        await storePlugin.configure({ accessToken });
      }
    }
    return true;
  }

  public async saveVC(
    args: IDataManagerSaveArgs,
  ): Promise<IDataManagerSaveResult[]> {
    const { data, options, accessToken } = args;

    let store;
    if (options === undefined) {
      store = Object.keys(this.stores);
    } else if (options.store === undefined) {
      store = Object.keys(this.stores);
    } else {
      store = options.store;
    }

    if (typeof store === 'string') {
      store = [store];
    }

    await this.checkTokenConfiguration(store, accessToken);

    // Save VC for all stores
    let res: IDataManagerSaveResult[] = [];
    for (const storeName of store) {
      const storePlugin = this.stores[storeName];

      try {
        const result = await storePlugin.saveVC({ data });
        const mappedResult = result.map((savedId) => {
          return { id: savedId, store: storeName };
        });
        res = [...res, ...mappedResult];
      } catch (e) {
        console.log(e);
      }
    }
    return res;
  }

  public async queryVC(
    args: IDataManagerQueryArgs,
  ): Promise<IDataManagerQueryResult[]> {
    const {
      filter = { type: 'none', filter: {} },
      options,
      accessToken,
    } = args;

    let store;
    let returnStore = true;
    if (options === undefined) {
      store = Object.keys(this.stores);
    } else {
      if (options.store === undefined) {
        store = Object.keys(this.stores);
      } else {
        store = options.store;
      }

      if (options.returnStore !== undefined) {
        returnStore = options.returnStore;
      }
    }

    if (typeof store === 'string') {
      store = [store];
    }

    await this.checkTokenConfiguration(store, accessToken);

    let res: IDataManagerQueryResult[] = [];
    for (const storeName of store) {
      const storePlugin = this.stores[storeName];

      try {
        const result = await storePlugin.queryVC({ filter });
        const mappedResult = result.map((r) => {
          if (returnStore) {
            return {
              data: r.data,
              metadata: { id: r.metadata.id, store: storeName },
            };
          }
          return { data: r.data, metadata: { id: r.metadata.id } };
        });
        res = [...res, ...mappedResult];
      } catch (e) {
        console.log(e);
      }
    }
    return res;
  }

  public async deleteVC(
    args: IDataManagerDeleteArgs,
  ): Promise<IDataManagerDeleteResult[]> {
    const { id, options, accessToken } = args;
    let store;
    if (options === undefined) {
      store = Object.keys(this.stores);
    } else if (options.store === undefined) {
      store = Object.keys(this.stores);
    } else {
      store = options.store;
    }

    if (typeof store === 'string') {
      store = [store];
    }

    await this.checkTokenConfiguration(store, accessToken);

    const res: IDataManagerDeleteResult[] = [];
    for (const storeName of store) {
      const storePlugin = this.stores[storeName];

      try {
        const result = await storePlugin.deleteVC({ id });
        res.push({ id, removed: result, store: storeName });
      } catch (e) {
        console.log(e);
      }
    }
    return res;
  }

  public async clearVCs(
    args: IDataManagerClearArgs,
  ): Promise<IDataManagerClearResult[]> {
    const {
      filter = { type: 'none', filter: {} },
      options,
      accessToken,
    } = args;
    let store;
    if (options === undefined) {
      store = Object.keys(this.stores);
    } else if (options.store === undefined) {
      store = Object.keys(this.stores);
    } else {
      store = options.store;
    }

    if (typeof store === 'string') {
      store = [store];
    }

    await this.checkTokenConfiguration(store, accessToken);

    const res: IDataManagerClearResult[] = [];
    for (const storeName of store) {
      const storePlugin = this.stores[storeName];

      try {
        const result = await storePlugin.clearVCs({ filter });
        res.push({ removed: result, store: storeName });
      } catch (e) {
        console.log(e);
      }
    }
    return res;
  }
}
