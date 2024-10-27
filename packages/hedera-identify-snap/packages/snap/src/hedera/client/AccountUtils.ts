/*
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

import {
  AccountCreateTransaction,
  Client,
  Hbar,
  PublicKey,
  TransactionReceipt,
} from '@hashgraph/sdk';
import { BigNumber } from 'bignumber.js';
import { HederaMirrorInfo } from '../service';

export class AccountUtils {
  /**
   * Create Hedera™ crypto-currency account.
   *
   * @param client - Hedera Client.
   * @param options - Create account options.
   * @param options.publicKey - Public key.
   * @param options.initialBalance - Initial balance.
   */
  public static async createAccountForPublicKey(
    client: Client,
    options: {
      publicKey: PublicKey;
      initialBalance: BigNumber;
    }
  ): Promise<HederaMirrorInfo | null> {
    const tx = new AccountCreateTransaction()
      .setInitialBalance(Hbar.fromTinybars(options.initialBalance))
      .setMaxTransactionFee(new Hbar(1))
      .setKey(options.publicKey);

    const receipt: TransactionReceipt = await (
      await tx.execute(client)
    ).getReceipt(client);

    const newAccountId = receipt.accountId ? receipt.accountId.toString() : '';

    console.log('newAccountId: ', newAccountId);

    if (!newAccountId) {
      console.log(
        "The transaction didn't process successfully so a new accountId was not created",
      );
      return null;
    }

    return {
      account: newAccountId,
      publicKey: options.publicKey.toStringRaw(),
    } as HederaMirrorInfo;
  }
}
