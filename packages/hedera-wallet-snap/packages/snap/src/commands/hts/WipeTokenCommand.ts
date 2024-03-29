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

import { TokenWipeTransaction, type Client } from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class WipeTokenCommand {
  readonly #assetType: 'TOKEN' | 'NFT';

  readonly #tokenId: string;

  readonly #accountId: string;

  readonly #serialNumbers: number[];

  readonly #amount: number | undefined;

  constructor(
    assetType: 'TOKEN' | 'NFT',
    tokenId: string,
    accountId: string,
    serialNumbers: number[],
    amount?: number,
  ) {
    this.#assetType = assetType;
    this.#tokenId = tokenId;
    this.#accountId = accountId;
    this.#serialNumbers = serialNumbers;
    this.#amount = amount;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transaction = new TokenWipeTransaction()
      .setTokenId(this.#tokenId)
      .setAccountId(this.#accountId);

    if (this.#assetType === 'NFT') {
      transaction.setSerials(this.#serialNumbers);
    } else {
      transaction.setAmount(this.#amount as number);
    }

    return await Utils.executeTransaction(client, transaction);
  }
}
