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

import { Hbar, TransferTransaction } from '@hashgraph/sdk';
import type { PrivateKey, Client } from '@hashgraph/sdk';

export class SwapRequestCommand {
  readonly #sourceAccountId: string;

  readonly #destinationAccountId: string;

  readonly #tokenId: string | undefined;

  readonly #tokenAmount: number | undefined;

  readonly #hbarAmount: number | undefined;

  readonly #senderPrivateKey: PrivateKey;

  constructor(
    sourceAccountId: string,
    destinationAccountId: string,
    senderPrivateKey: PrivateKey,
    tokenId?: string,
    tokenAmount?: number,
    hbarAmount?: number,
  ) {
    this.#sourceAccountId = sourceAccountId;
    this.#destinationAccountId = destinationAccountId;
    this.#tokenId = tokenId;
    this.#tokenAmount = tokenAmount;
    this.#hbarAmount = hbarAmount;
    this.#senderPrivateKey = senderPrivateKey;
  }

  public async execute(client: Client): Promise<TransferTransaction> {
    let atomicSwap = new TransferTransaction();

    if (this.#hbarAmount !== undefined) {
      atomicSwap = atomicSwap.addHbarTransfer(
        this.#sourceAccountId,
        new Hbar(this.#hbarAmount),
      );
      atomicSwap = atomicSwap.addHbarTransfer(
        this.#destinationAccountId,
        new Hbar(this.#hbarAmount),
      );
    }

    if (this.#tokenId !== undefined && this.#tokenAmount !== undefined) {
      atomicSwap = atomicSwap.addTokenTransfer(
        this.#tokenId,
        this.#sourceAccountId,
        this.#tokenAmount,
      );
      atomicSwap = atomicSwap.addTokenTransfer(
        this.#tokenId,
        this.#destinationAccountId,
        this.#tokenAmount,
      );
    }
    atomicSwap = atomicSwap.freezeWith(client);
    atomicSwap = await atomicSwap.sign(this.#senderPrivateKey);

    return atomicSwap;
  }
}
