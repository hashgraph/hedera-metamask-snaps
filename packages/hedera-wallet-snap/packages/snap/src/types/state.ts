/*-
 *
 * Hedera Wallet Snap
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

import type { Account, AccountInfo } from './account';

export type WalletSnapState = {
  currentAccount: Account;

  /**
   * Account specific storage
   * mapping(evm address -> mapping(network -> state))
   */
  accountState: Record<string, Record<string, WalletAccountState>>;

  /**
   * Configuration for WalletSnap
   */
  snapConfig: WalletSnapConfig;
};

export type WalletSnapConfig = {
  snap: {
    acceptedTerms: boolean;
  };
  dApp: {
    disablePopups: boolean;
    friendlyDapps: string[];
  };
};

export type KeyStore = {
  curve: 'ECDSA_SECP256K1' | 'ED25519';
  privateKey: string;
  publicKey: string;
  address: string;
  hederaAccountId: string;
};

/**
 * Wallet Snap State for a MetaMask address
 */
export type WalletAccountState = {
  keyStore: KeyStore;
  mirrorNodeUrl: string;
  accountInfo: AccountInfo;
};

export type WalletSnapParams = {
  origin: string;
  state: WalletSnapState;
};
