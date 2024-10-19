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

export type ISaveArgs = {
  data: unknown;
  options?: unknown;
};

export type ISaveVC = {
  vc: unknown;
  id?: string;
};

export type IDeleteArgs = {
  id: string;
  options?: unknown;
};

export type IFilterArgs = {
  filter?: {
    type: string;
    filter: unknown;
  };
};

export type IConfigureArgs = {
  accessToken: string;
};

export type IQueryResult = {
  data: unknown;
  metadata: {
    id: string;
  };
};

export abstract class AbstractDataStore {
  abstract saveVC(args: ISaveArgs): Promise<string[]>;

  abstract deleteVC(args: IDeleteArgs): Promise<boolean>;

  abstract queryVC(args: IFilterArgs): Promise<IQueryResult[]>;

  abstract clearVCs(args: IFilterArgs): Promise<boolean>;

  abstract configure?(args: IConfigureArgs): Promise<boolean>;
}
