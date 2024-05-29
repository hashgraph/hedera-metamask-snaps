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

import type { Client } from '@hashgraph/sdk';
import { EthereumTransaction, FileId } from '@hashgraph/sdk';
import { CryptoUtils } from 'src/utils/CryptoUtils';

export class EthereumTransactionCommand {
  readonly #ethereumData: string;

  readonly #callDataFileId: string | undefined;

  readonly #maxGasAllowanceHbar: number | undefined;

  constructor(
    ethereumData: string,
    callDataFileId?: string,
    maxGasAllowanceHbar?: number,
  ) {
    this.#ethereumData = ethereumData;
    this.#callDataFileId = callDataFileId;
    this.#maxGasAllowanceHbar = maxGasAllowanceHbar;
  }

  public async execute(client: Client): Promise<any> {
    const transaction = new EthereumTransaction().setEthereumData(
      CryptoUtils.stringToUint8Array(this.#ethereumData),
    );

    if (this.#callDataFileId) {
      transaction.setCallDataFileId(FileId.fromString(this.#callDataFileId));
    }
    if (this.#maxGasAllowanceHbar !== undefined) {
      transaction.setMaxGasAllowanceHbar(this.#maxGasAllowanceHbar);
    }

    // Execute the transaction
    return await transaction.execute(client);
  }
}
