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
import { QueryMetadata, SaveOptions } from './veramo';

export type GetSnapsResponse = Record<string, Snap>;

export type Snap = {
  permissionName: string;
  id: string;
  version: string;
  initialPermissions: Record<string, unknown>;
};

export type ExternalAccountParams = {
  externalAccount: {
    blockchainType: string;
    data: {
      accountId?: string;
      address?: string;
    };
  };
};

export type PublicAccountInfo = {
  metamaskAddress: string;
  snapAddress: string;
  did: string;
  method: string;
  accountID: string;
};

export type UploadData = {
  fileName: string;
  content: string;
};

export type GoogleToken = {
  accessToken: string;
};

export type AccountViaPrivateKey = {
  privateKey: string;
  publicKey: string;
  address: string;
  extraData?: unknown;
};

export type ExternalAccount = {
  externalAccount: {
    blockchainType: string;
    data: unknown;
  };
};

export type HederaAccountParams = {
  accountId: string;
};

export type EvmAccountParams = {
  address: string;
};

export type MetamaskAccountParams = {
  metamaskAddress: string;
};

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
