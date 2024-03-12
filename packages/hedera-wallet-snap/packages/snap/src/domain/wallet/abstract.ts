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

import type { PrivateKey, PublicKey } from '@hashgraph/sdk';

// index:
// < 0 => alternative deriviations or forms (mnemonics have tons of these)
// = 0 => canonical deriviation of a key from the wallet
// - mnemonic, non-legacy root + .derive(0)
// - ledger, index: 0
// - others, as-is
// > 0 => additional accounts from the wallet
// - mnemonic, non-legacy root + .derive(N)
// - ledger, index: N
// - others, not supported

export abstract class Wallet {
  // produce a transaction signer
  // that can be used to sign transactions
  abstract getTransactionSigner(
    index: number,
  ): Promise<(transactionBody: Uint8Array) => Promise<Uint8Array>>;

  // get the public key associated with the wallet
  abstract getPublicKey(index: number): Promise<PublicKey | undefined>;

  // Get the private key associated with the wallet (if avaialble)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPrivateKey(_index: number): Promise<PrivateKey | null> {
    return Promise.resolve(null);
  }

  // returns true if there is an accessible private key
  hasPrivateKey(): boolean {
    return false;
  }

  get minIndex(): number {
    return 0;
  }

  get maxIndex(): number {
    return 0;
  }
}
