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

import { IIdentifier, IKey, W3CVerifiableCredential } from '@veramo/core';
import { ManagedPrivateKey } from '@veramo/key-manager';
import type { Account, HederaAccountInfo } from './account';

export type IdentifySnapState = {
  currentAccount: Account;

  /**
   * Account specific storage
   * mapping(evm address -> mapping(network -> state))
   */
  accountState: Record<string, Record<string, IdentifyAccountState>>;

  /**
   * Configuration for IdentifySnap
   */
  snapConfig: IdentifySnapConfig;
};

export type IdentifySnapConfig = {
  snap: {
    acceptedTerms: boolean;
  };
  dApp: {
    didMethod: string;
    disablePopups: boolean;
    friendlyDapps: string[];
  };
};

export type KeyStore = {
  curve: string;
  privateKey: string;
  publicKey: string;
  address: string;
  hederaAccountId: string;
};

/**
 * Identify Snap State for a MetaMask address
 */
export type IdentifyAccountState = {
  keyStore: KeyStore;
  accountInfo: HederaAccountInfo;

  snapKeyStore: Record<string, IKey>;
  snapPrivateKeyStore: Record<string, ManagedPrivateKey>;
  identifiers: Record<string, IIdentifier>;
  vcs: Record<string, W3CVerifiableCredential>;

  accountConfig: IdentifyAccountConfig;
};

export type IdentifyAccountConfig = {
  identity: {
    vcStore: string;
    googleUserInfo: GoogleUserInfo;
  };
};

export type GoogleUserInfo = {
  accessToken: string;
  email: string;
};

export type IdentifySnapParams = {
  origin: string;
  state: IdentifySnapState;
};
