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

/* eslint-disable @typescript-eslint/unbound-method */

import {
  Client,
  PrivateKey,
  PublicKey,
  TokenUpdateTransaction,
} from '@hashgraph/sdk';
import { UpdateTokenRequestParams } from '../../types/params';
import { TxReceipt } from '../../types/hedera';
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
    const updateTransaction = this.#createTransaction(
      updateParams,
      this.#tokenId,
    );

    const signTx = await updateTransaction
      .freezeWith(client)
      .sign(this.#adminKey);

    const txResponse = await signTx.execute(client);

    const receipt = await txResponse.getReceipt(client);

    return Utils.formatTransactionReceipt(receipt);
  }

  #createTransaction(
    updateParams: UpdateTokenRequestParams,
    tokenId: string,
  ): TokenUpdateTransaction {
    const transaction = new TokenUpdateTransaction().setTokenId(tokenId);

    if (updateParams.name !== undefined) {
      transaction.setTokenName(updateParams.name);
    }

    if (updateParams.symbol !== undefined) {
      transaction.setTokenSymbol(updateParams.symbol);
    }

    if (updateParams.treasuryAccountId !== undefined) {
      transaction.setTreasuryAccountId(updateParams.treasuryAccountId);
    }

    if (updateParams.adminKey !== undefined) {
      transaction.setAdminKey(PublicKey.fromStringECDSA(updateParams.adminKey));
    }

    if (updateParams.kycKey !== undefined) {
      transaction.setKycKey(PublicKey.fromStringECDSA(updateParams.kycKey));
    }

    if (updateParams.freezeKey !== undefined) {
      transaction.setFreezeKey(
        PublicKey.fromStringECDSA(updateParams.freezeKey),
      );
    }

    if (updateParams.feeScheduleKey !== undefined) {
      transaction.setFeeScheduleKey(
        PublicKey.fromStringECDSA(updateParams.feeScheduleKey),
      );
    }

    if (updateParams.pauseKey !== undefined) {
      transaction.setPauseKey(PublicKey.fromStringECDSA(updateParams.pauseKey));
    }

    if (updateParams.wipeKey !== undefined) {
      transaction.setWipeKey(PublicKey.fromStringECDSA(updateParams.wipeKey));
    }

    if (updateParams.supplyKey !== undefined) {
      transaction.setSupplyKey(
        PublicKey.fromStringECDSA(updateParams.supplyKey),
      );
    }

    if (updateParams.expirationTime !== undefined) {
      transaction.setExpirationTime(new Date(updateParams.expirationTime));
    }

    if (updateParams.memo !== undefined) {
      transaction.setTokenMemo(updateParams.memo);
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
