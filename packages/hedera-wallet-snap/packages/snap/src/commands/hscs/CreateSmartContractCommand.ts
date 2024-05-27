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
import { ContractCreateFlow, Hbar, PublicKey } from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { Utils } from '../../utils/Utils';

export class CreateSmartContractCommand {
  readonly #gas: number;

  readonly #bytecode: string;

  readonly #initialBalance: number | undefined;

  readonly #adminKey: string | undefined;

  readonly #constructorParameters: string | undefined;

  readonly #contractMemo: string | undefined;

  readonly #stakedNodeId: number | undefined;

  readonly #stakedAccountId: string | undefined;

  readonly #declineStakingReward: boolean | undefined;

  readonly #autoRenewAccountId: string | undefined;

  readonly #autoRenewPeriod: number | undefined;

  readonly #maxAutomaticTokenAssociations: number | undefined;

  constructor(
    gas: number,
    bytecode: string,
    initialBalance?: number,
    adminKey?: string,
    constructorParameters?: string,
    contractMemo?: string,
    stakedNodeId?: number,
    stakedAccountId?: string,
    declineStakingReward?: boolean,
    autoRenewAccountId?: string,
    autoRenewPeriod?: number,
    maxAutomaticTokenAssociations?: number,
  ) {
    this.#gas = gas;
    this.#bytecode = bytecode;
    this.#initialBalance = initialBalance;
    this.#adminKey = adminKey;
    this.#constructorParameters = constructorParameters;
    this.#contractMemo = contractMemo;
    this.#stakedNodeId = stakedNodeId;
    this.#stakedAccountId = stakedAccountId;
    this.#declineStakingReward = declineStakingReward;
    this.#autoRenewAccountId = autoRenewAccountId;
    this.#autoRenewPeriod = autoRenewPeriod;
    this.#maxAutomaticTokenAssociations = maxAutomaticTokenAssociations;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transaction = new ContractCreateFlow()
      .setGas(this.#gas)
      .setBytecode(this.#bytecode);

    if (this.#initialBalance !== undefined) {
      transaction.setInitialBalance(new Hbar(this.#initialBalance));
    }
    if (this.#adminKey) {
      transaction.setAdminKey(PublicKey.fromString(this.#adminKey));
    }
    if (this.#constructorParameters) {
      transaction.setConstructorParameters(
        CryptoUtils.stringToUint8Array(this.#constructorParameters),
      );
    }
    if (this.#contractMemo) {
      transaction.setContractMemo(this.#contractMemo);
    }
    if (this.#stakedNodeId !== undefined) {
      transaction.setStakedNodeId(this.#stakedNodeId);
    }
    if (this.#stakedAccountId) {
      transaction.setStakedAccountId(this.#stakedAccountId);
    }
    if (this.#declineStakingReward !== undefined) {
      transaction.setDeclineStakingReward(this.#declineStakingReward);
    }
    if (this.#autoRenewAccountId) {
      transaction.setAutoRenewAccountId(this.#autoRenewAccountId);
    }
    if (this.#autoRenewPeriod !== undefined) {
      transaction.setAutoRenewPeriod(this.#autoRenewPeriod);
    }
    if (this.#maxAutomaticTokenAssociations !== undefined) {
      transaction.setMaxAutomaticTokenAssociations(
        this.#maxAutomaticTokenAssociations,
      );
    }

    return await Utils.executeTransaction(client, transaction);
  }
}
