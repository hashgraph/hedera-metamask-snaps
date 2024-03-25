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
import type { AtomicSwapRequestParams } from '../../types/params';

export class SwapRequestCommand {
  readonly #atomicSwapData: AtomicSwapRequestParams;

  readonly #senderPrivateKey: PrivateKey;

  constructor(
    atomicSwapData: AtomicSwapRequestParams,
    senderPrivateKey: PrivateKey,
  ) {
    this.#atomicSwapData = atomicSwapData;
    this.#senderPrivateKey = senderPrivateKey;
  }

  public async execute(client: Client): Promise<TransferTransaction> {
    let atomicSwap = new TransferTransaction();

    if (this.#atomicSwapData.sourceHbarAmount !== undefined) {
      atomicSwap = atomicSwap.addHbarTransfer(
        this.#atomicSwapData.sourceAccountId,
        new Hbar(-this.#atomicSwapData.sourceHbarAmount),
      );
      atomicSwap = atomicSwap.addHbarTransfer(
        this.#atomicSwapData.destinationAccountId,
        new Hbar(this.#atomicSwapData.sourceHbarAmount),
      );
    }

    if (this.#atomicSwapData.destinationHbarAmount !== undefined) {
      atomicSwap = atomicSwap.addHbarTransfer(
        this.#atomicSwapData.destinationAccountId,
        -this.#atomicSwapData.destinationHbarAmount,
      );

      atomicSwap = atomicSwap.addHbarTransfer(
        this.#atomicSwapData.sourceAccountId,
        this.#atomicSwapData.destinationHbarAmount,
      );
    }

    if (
      this.#atomicSwapData.sourceTokenId !== undefined &&
      this.#atomicSwapData.sourceTokenAmount !== undefined
    ) {
      atomicSwap = atomicSwap.addTokenTransfer(
        this.#atomicSwapData.sourceTokenId,
        this.#atomicSwapData.sourceAccountId,
        -this.#atomicSwapData.sourceTokenAmount,
      );
      atomicSwap = atomicSwap.addTokenTransfer(
        this.#atomicSwapData.sourceTokenId,
        this.#atomicSwapData.destinationAccountId,
        this.#atomicSwapData.sourceTokenAmount,
      );
    }

    if (
      this.#atomicSwapData.destinationTokenId !== undefined &&
      this.#atomicSwapData.destinationTokenAmount !== undefined
    ) {
      atomicSwap = atomicSwap.addTokenTransfer(
        this.#atomicSwapData.destinationTokenId,
        this.#atomicSwapData.destinationAccountId,
        -this.#atomicSwapData.destinationTokenAmount,
      );
      atomicSwap = atomicSwap.addTokenTransfer(
        this.#atomicSwapData.destinationTokenId,
        this.#atomicSwapData.sourceAccountId,
        this.#atomicSwapData.destinationTokenAmount,
      );
    }

    atomicSwap = atomicSwap.freezeWith(client);
    atomicSwap = await atomicSwap.sign(this.#senderPrivateKey);

    return atomicSwap;
  }
}
