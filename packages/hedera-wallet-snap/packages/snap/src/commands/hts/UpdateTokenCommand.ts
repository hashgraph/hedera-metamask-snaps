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

import type { Client, PrivateKey } from '@hashgraph/sdk';
import { PublicKey, TokenUpdateTransaction } from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import type { UpdateTokenRequestParams } from '../../types/params';
import { Utils } from '../../utils/Utils';

export class UpdateTokenCommand {
  readonly #tokenId: string;

  readonly #adminKey: PrivateKey;

  constructor(tokenId: string, adminKey: PrivateKey) {
    this.#tokenId = tokenId;
    this.#adminKey = adminKey;
  }

  public async execute(
    client: Client,
    updateParams: UpdateTokenRequestParams,
  ): Promise<TxReceipt> {
    const updateTransaction = this.#updateTransaction(updateParams);

    const transaction = await updateTransaction.sign(this.#adminKey);

    return await Utils.executeTransaction(client, transaction);
  }

  #updateTransaction(
    updateParams: UpdateTokenRequestParams,
  ): TokenUpdateTransaction {
    const transaction = new TokenUpdateTransaction().setTokenId(this.#tokenId);

    if (updateParams.name !== undefined) {
      transaction.setTokenName(updateParams.name);
    }

    if (updateParams.symbol !== undefined) {
      transaction.setTokenSymbol(updateParams.symbol);
    }

    if (updateParams.treasuryAccountId !== undefined) {
      transaction.setTreasuryAccountId(updateParams.treasuryAccountId);
    }

    if (updateParams.adminPublicKey !== undefined) {
      transaction.setAdminKey(
        PublicKey.fromStringECDSA(updateParams.adminPublicKey),
      );
    }

    if (updateParams.kycPublicKey !== undefined) {
      transaction.setKycKey(
        PublicKey.fromStringECDSA(updateParams.kycPublicKey),
      );
    }

    if (updateParams.freezePublicKey !== undefined) {
      transaction.setFreezeKey(
        PublicKey.fromStringECDSA(updateParams.freezePublicKey),
      );
    }

    if (updateParams.feeSchedulePublicKey !== undefined) {
      transaction.setFeeScheduleKey(
        PublicKey.fromStringECDSA(updateParams.feeSchedulePublicKey),
      );
    }

    if (updateParams.pausePublicKey !== undefined) {
      transaction.setPauseKey(
        PublicKey.fromStringECDSA(updateParams.pausePublicKey),
      );
    }

    if (updateParams.wipePublicKey !== undefined) {
      transaction.setWipeKey(
        PublicKey.fromStringECDSA(updateParams.wipePublicKey),
      );
    }

    if (updateParams.supplyPublicKey !== undefined) {
      transaction.setSupplyKey(
        PublicKey.fromStringECDSA(updateParams.supplyPublicKey),
      );
    }

    if (updateParams.expirationTime !== undefined) {
      transaction.setExpirationTime(new Date(updateParams.expirationTime));
    }

    if (updateParams.tokenMemo !== undefined) {
      transaction.setTokenMemo(updateParams.tokenMemo);
    }

    if (updateParams.autoRenewAccountId !== undefined) {
      transaction.setAutoRenewAccountId(updateParams.autoRenewAccountId);
    }

    if (updateParams.autoRenewPeriod !== undefined) {
      transaction.setAutoRenewPeriod(updateParams.autoRenewPeriod);
    }

    return transaction;
  }
}
