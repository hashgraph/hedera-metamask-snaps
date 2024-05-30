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

import type { Client, ContractInfo } from '@hashgraph/sdk';
import { ContractInfoQuery, HbarUnit } from '@hashgraph/sdk';
import type { GetSmartContractInfoResult } from '../../types/hedera';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { Utils } from '../../utils/Utils';

export class GetSmartContractInfoCommand {
  readonly #contractId: string;

  constructor(contractId: string) {
    this.#contractId = contractId;
  }

  public async execute(client: Client): Promise<GetSmartContractInfoResult> {
    const query = new ContractInfoQuery().setContractId(this.#contractId);
    const info: ContractInfo = await query.execute(client);

    return {
      contractId: this.#contractId,
      accountId: info.accountId.toString(),
      contractAccountId: info.contractAccountId,
      adminKey: CryptoUtils.keyToString(info.adminKey),
      expirationTime: Utils.timestampToString(info.expirationTime.toDate()),
      autoRenewPeriod: Number(info.autoRenewPeriod.seconds),
      autoRenewAccountId: info.autoRenewAccountId
        ? info.autoRenewAccountId.toString()
        : '',
      storage: Number(info.storage),
      contractMemo: info.contractMemo,
      balance: Number(info.balance.toString(HbarUnit.Hbar).replace(' ℏ', '')),
      isDeleted: info.isDeleted,
      tokenRelationships: info.tokenRelationships.toJSON(),
      ledgerId: info.ledgerId ? info.ledgerId.toString() : '',
      stakingInfo: info.stakingInfo ? info.stakingInfo.toJSON() : {},
    } as GetSmartContractInfoResult;
  }
}
