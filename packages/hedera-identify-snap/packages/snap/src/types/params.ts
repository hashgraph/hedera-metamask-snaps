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

import { ProofFormat, W3CVerifiableCredential } from '@veramo/core';
import {
  QueryMetadata,
  SaveOptions,
} from '../plugins/veramo/verifiable-creds-manager';

export type CreateVCRequestParams = {
  vcValue: object;
  vcKey?: string;
  credTypes?: string[];
  options?: SaveOptions;
  accessToken?: string;
};

export type CreateVCResponseResult = {
  data: W3CVerifiableCredential;
  metadata: QueryMetadata;
};

export type ProofInfo = {
  proofFormat?: ProofFormat;
  type?: string;
  domain?: string;
  challenge?: string;
};

export type CreateVPOptions = {
  store: string | string[];
};

export type CreateVPRequestParams = {
  vcIds?: string[];
  vcs?: W3CVerifiableCredential[];
  options?: CreateVPOptions;
  proofInfo?: ProofInfo;
};

export type CreateNewHederaAccountRequestParams = {
  hbarAmountToSend: number;
  newAccountPublickey?: string;
  newAccountEvmAddress?: string;
};
