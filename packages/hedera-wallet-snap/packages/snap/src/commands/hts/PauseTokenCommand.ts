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

import {
  TokenPauseTransaction,
  TokenUnpauseTransaction,
  type Client,
} from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class PauseTokenCommand {
  readonly #pause: boolean;

  readonly #tokenId: string;

  constructor(pause: boolean, tokenId: string) {
    this.#pause = pause;
    this.#tokenId = tokenId;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    let transaction: TokenPauseTransaction | TokenUnpauseTransaction;
    if (this.#pause) {
      transaction = new TokenPauseTransaction();
    } else {
      transaction = new TokenUnpauseTransaction();
    }

    transaction.setTokenId(this.#tokenId).freezeWith(client);

    return await Utils.executeTransaction(client, transaction);
  }
}
