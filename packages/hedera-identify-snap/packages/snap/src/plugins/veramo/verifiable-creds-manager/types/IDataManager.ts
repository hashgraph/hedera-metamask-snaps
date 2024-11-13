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

import { IPluginMethodMap } from '@veramo/core';

export type IDataManager = {
  queryVC(args: IDataManagerQueryArgs): Promise<IDataManagerQueryResult[]>;

  saveVC(args: IDataManagerSaveArgs): Promise<IDataManagerSaveResult[]>;

  deleteVC(args: IDataManagerDeleteArgs): Promise<IDataManagerDeleteResult[]>;

  clearVCs(args: IDataManagerClearArgs): Promise<IDataManagerClearResult[]>;
} & IPluginMethodMap;

/**
 * Types
 */
export type Filter = {
  type: string;
  filter: unknown;
};

export type QueryOptions = {
  store?: string | string[];
  returnStore?: boolean;
};

export type SaveOptions = {
  store: string | string[];
};

export type DeleteOptions = {
  store: string | string[];
};

export type ClearOptions = {
  store: string | string[];
};

export type QueryMetadata = {
  id: string;
  store?: string | string[];
};

/**
 * Types for DataManager method arguments
 */
export type IDataManagerQueryArgs = {
  filter?: Filter;
  options?: QueryOptions;
  accessToken?: string;
};

export type IDataManagerSaveArgs = {
  data: unknown;
  options?: SaveOptions;
  accessToken?: string;
};

export type IDataManagerClearArgs = {
  filter?: Filter;
  options?: ClearOptions;
  accessToken?: string;
};

export type IDataManagerDeleteArgs = {
  id: string | string[];
  options?: DeleteOptions;
  accessToken?: string;
};

/**
 * Types for DataManager method return values
 */
export type IDataManagerQueryResult = {
  data: any;
  metadata: QueryMetadata;
};

export type IDataManagerSaveResult = {
  id: string;
  store: string;
};

export type IDataManagerDeleteResult = {
  id: string;
  store: string;
  removed: boolean;
};

export type IDataManagerClearResult = {
  store: string;
  removed: boolean;
};
