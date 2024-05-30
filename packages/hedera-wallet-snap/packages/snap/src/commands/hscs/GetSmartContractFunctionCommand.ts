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
import { ContractCallQuery, ContractFunctionParameters } from '@hashgraph/sdk';
import type { GetSmartContractFunctionResult } from '../../types/hedera';
import type { SmartContractFunctionParameter } from '../../types/params';
import { CryptoUtils } from '../../utils/CryptoUtils';

export class GetSmartContractFunctionCommand {
  readonly #contractId: string;

  readonly #functionName: string;

  readonly #functionParams: SmartContractFunctionParameter[] | undefined;

  readonly #gas: number;

  readonly #senderAccountId: string | undefined;

  constructor(
    contractId: string,
    functionName: string,
    functionParams: SmartContractFunctionParameter[] | undefined,
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
      const params = new ContractFunctionParameters();
      this.#functionParams.forEach((param) => {
        switch (param.type) {
          case 'string':
            params.addString(param.value as string);
            break;
          case 'bytes':
            params.addBytes(param.value as Uint8Array);
            break;
          case 'boolean':
            params.addBool(param.value as boolean);
            break;
          case 'int':
            params.addInt256(param.value as number);
            break;
          case 'uint':
            params.addUint256(param.value as number);
            break;
          default:
            throw new Error(
              `Unsupported constructor parameter type: only 'string', 'bytes', 'boolean', 'int', 'uint' are supported`,
            );
        }
      });
      query.setFunction(this.#functionName, params);
    }

    if (this.#senderAccountId) {
      query.setSenderAccountId(this.#senderAccountId);
    }

    // Execute the query
    const contractCallResult: ContractFunctionResult =
      await query.execute(client);

    return {
      contractId: contractCallResult.contractId
        ? contractCallResult.contractId.toString()
        : '',
      bytes: CryptoUtils.uint8ArrayToHex(contractCallResult.bytes),
      bloom: CryptoUtils.uint8ArrayToHex(contractCallResult.bloom),
      gasUsed: Number(contractCallResult.gasUsed),
      errorMessage: contractCallResult.errorMessage
        ? contractCallResult.errorMessage
        : '',
      logs: contractCallResult.logs.toString(),
      signerNonce: JSON.parse(JSON.stringify(contractCallResult.signerNonce)),
      evmAddress: contractCallResult.evmAddress
        ? contractCallResult.evmAddress.toString()
        : '',
      gas: Number(contractCallResult.gas),
      amount: Number(contractCallResult.amount),
      contractNonces: contractCallResult.contractNonces.toString(),
    } as GetSmartContractFunctionResult;
  }
}
