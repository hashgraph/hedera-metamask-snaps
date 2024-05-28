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

import type { Client, ContractFunctionResult } from '@hashgraph/sdk';
import {
  ContractCallQuery,
  ContractFunctionParameters,
  Hbar,
} from '@hashgraph/sdk';
import type { GetSmartContractFunctionResult } from '../../types/hedera';
import { CryptoUtils } from '../../utils/CryptoUtils';

export class GetSmartContractFunctionCommand {
  readonly #contractId: string;

  readonly #functionName: string;

  readonly #functionParams: string | undefined;

  readonly #gas: number;

  readonly #senderAccountId: string | undefined;

  constructor(
    contractId: string,
    functionName: string,
    functionParams: string | undefined,
    gas: number,
    senderAccountId: string | undefined,
  ) {
    this.#contractId = contractId;
    this.#functionName = functionName;
    this.#functionParams = functionParams;
    this.#gas = gas;
    this.#senderAccountId = senderAccountId;
  }

  public async execute(
    client: Client,
  ): Promise<GetSmartContractFunctionResult> {
    const query = new ContractCallQuery()
      .setContractId(this.#contractId)
      .setGas(this.#gas);

    if (this.#functionParams === undefined) {
      query.setFunction(this.#functionName);
    } else {
      query.setFunction(
        this.#functionName,
        new ContractFunctionParameters().addString(this.#functionParams),
      );
    }

    if (this.#senderAccountId) {
      query.setSenderAccountId(this.#senderAccountId);
    }

    query.setQueryPayment(new Hbar(1));

    // Execute the query
    const contractCallResult: ContractFunctionResult =
      await query.execute(client);

    console.log(
      'Contract call result:',
      JSON.stringify(contractCallResult, null, 4),
    );
    // console.log('message:', contractCallResult.getString(0));

    return {
      contractId: contractCallResult.contractId?.toString(),
      bloom: CryptoUtils.uint8ArrayToHex(contractCallResult.bloom),
      gasUsed: Number(contractCallResult.gasUsed),
      errorMessage: contractCallResult.errorMessage,
      logs: contractCallResult.logs.toString(),
      signerNonce: contractCallResult.signerNonce,
    } as GetSmartContractFunctionResult;
  }
}
