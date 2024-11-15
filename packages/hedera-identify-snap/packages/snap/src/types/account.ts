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

import { IIdentifier } from '@veramo/core';

export type ExternalAccount = {
  externalAccount: {
    accountIdOrEvmAddress: string;
    curve?: 'ECDSA_SECP256K1' | 'ED25519';
  };
};

export type Account = {
  metamaskEvmAddress: string;
  externalEvmAddress: string;
  method: string;
  identifier: IIdentifier;
  hederaAccountId: string;
  snapEvmAddress: string;
  privateKey: string;
  publicKey: string;
  network: string;
};

export type PublicAccountInfo = {
  metamaskAddress: string;
  snapAddress: string;
  did: string;
  method: string;
  hederaAccountId: string;
};

export type HederaAccountInfo = {
  accountId: string;
  evmAddress: string;
  key: {
    type: string;
    key: string;
  };
};

export type NetworkParams = {
  network: string;
};
