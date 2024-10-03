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
import { ContractByteCodeQuery } from '@hashgraph/sdk';
import { CryptoUtils } from '../../utils/CryptoUtils';

export class GetSmartContractBytecodeCommand {
  readonly #contractId: string;

  constructor(contractId: string) {
    this.#contractId = contractId;
  }

  public async execute(client: Client): Promise<string> {
    const query = new ContractByteCodeQuery().setContractId(this.#contractId);
    const bytecode = await query.execute(client);
    return CryptoUtils.uint8ArrayToHex(bytecode);
  }
}
