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

import type { PrivateKey, PublicKey } from '@hashgraph/sdk';

import { Wallet } from './abstract';

export class PrivateKeySoftwareWallet extends Wallet {
  private _privateKey: PrivateKey;

  constructor(privateKey: PrivateKey) {
    super();

    this._privateKey = privateKey;
  }

  getTransactionSigner(): Promise<
    (transactionBody: Uint8Array) => Promise<Uint8Array>
  > {
    return Promise.resolve((transactionBody) =>
      Promise.resolve(this._privateKey.sign(transactionBody)),
    );
  }

  getPublicKey(): Promise<PublicKey> {
    return Promise.resolve(this._privateKey.publicKey);
  }

  getPrivateKey(): Promise<PrivateKey> {
    return Promise.resolve(this._privateKey);
  }

  hasPrivateKey(): boolean {
    return true;
  }
}
