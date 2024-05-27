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
import { ContractUpdateTransaction, PublicKey } from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class UpdateSmartContractCommand {
  readonly #contractId: string;

  readonly #adminKey: string | undefined;

  readonly #contractMemo: string | undefined;

  readonly #expirationTime: string | undefined;

  readonly #maxAutomaticTokenAssociations: number | undefined;

  readonly #stakedAccountId: string | undefined;

  readonly #stakedNodeId: number | undefined;

  readonly #declineStakingReward: boolean | undefined;

  readonly #autoRenewPeriod: number | undefined;

  readonly #autoRenewAccountId: string | undefined;

  constructor(
    contractId: string,
    adminKey: string | undefined,
    contractMemo: string | undefined,
    expirationTime: string | undefined,
    maxAutomaticTokenAssociations: number | undefined,
    stakedAccountId: string | undefined,
    stakedNodeId: number | undefined,
    declineStakingReward: boolean | undefined,
    autoRenewPeriod: number | undefined,
    autoRenewAccountId: string | undefined,
  ) {
    this.#contractId = contractId;
    this.#adminKey = adminKey;
    this.#contractMemo = contractMemo;
    this.#expirationTime = expirationTime;
    this.#maxAutomaticTokenAssociations = maxAutomaticTokenAssociations;
    this.#stakedAccountId = stakedAccountId;
    this.#stakedNodeId = stakedNodeId;
    this.#declineStakingReward = declineStakingReward;
    this.#autoRenewPeriod = autoRenewPeriod;
    this.#autoRenewAccountId = autoRenewAccountId;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transaction = new ContractUpdateTransaction().setContractId(
      this.#contractId,
    );

    if (this.#adminKey) {
      transaction.setAdminKey(PublicKey.fromString(this.#adminKey));
    }
    if (this.#contractMemo) {
      transaction.setContractMemo(this.#contractMemo);
    }
    if (this.#expirationTime) {
      transaction.setExpirationTime(new Date(this.#expirationTime));
    }
    if (this.#maxAutomaticTokenAssociations !== undefined) {
      transaction.setMaxAutomaticTokenAssociations(
        this.#maxAutomaticTokenAssociations,
      );
    }
    if (this.#stakedAccountId) {
      transaction.setStakedAccountId(this.#stakedAccountId);
    }
    if (this.#stakedNodeId !== undefined) {
      transaction.setStakedNodeId(this.#stakedNodeId);
    }
    if (this.#declineStakingReward !== undefined) {
      transaction.setDeclineStakingReward(this.#declineStakingReward);
    }
    if (this.#autoRenewPeriod !== undefined) {
      transaction.setAutoRenewPeriod(this.#autoRenewPeriod);
    }
    if (this.#autoRenewAccountId) {
      transaction.setAutoRenewAccountId(this.#autoRenewAccountId);
    }

    // Freeze the transaction
    transaction.freezeWith(client);

    // Sign the transaction with the client operator private key and submit to a Hedera network
    return await Utils.executeTransaction(client, transaction);
  }
}
