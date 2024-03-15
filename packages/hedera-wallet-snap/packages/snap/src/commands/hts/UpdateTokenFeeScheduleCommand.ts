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

import {
  Client,
  CustomFixedFee,
  Hbar,
  PrivateKey,
  TokenFeeScheduleUpdateTransaction,
} from '@hashgraph/sdk';
import { TokenCustomFee } from '../../types/params';
import { TxReceipt } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class UpdateTokenFeeScheduleCommand {
  readonly #tokenId: string;

  readonly #feeScheduleKey: PrivateKey;

  readonly #decimals: number;

  readonly #customFees: TokenCustomFee[];

  constructor(
    tokenId: string,
    feeScheduleKey: PrivateKey,
    decimals: number,
    customFees: TokenCustomFee[],
  ) {
    this.#tokenId = tokenId;
    this.#feeScheduleKey = feeScheduleKey;
    this.#decimals = decimals;
    this.#customFees = customFees;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transaction = new TokenFeeScheduleUpdateTransaction()
      .setTokenId(this.#tokenId)
      .setCustomFees(this.#convertCustomFees(this.#customFees, this.#decimals))
      .freezeWith(client);

    const signedTx = await transaction.sign(this.#feeScheduleKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return Utils.formatTransactionReceipt(receipt);
  }

  #convertCustomFees(
    customTokenFees: TokenCustomFee[],
    decimals: number,
  ): CustomFixedFee[] {
    const customFees: CustomFixedFee[] = customTokenFees.map(
      (tokenCustomFee: TokenCustomFee) => {
        const customFee = new CustomFixedFee({
          feeCollectorAccountId: tokenCustomFee.feeCollectorAccountId,
        });
        if (tokenCustomFee.hbarAmount) {
          customFee.setHbarAmount(new Hbar(tokenCustomFee.hbarAmount));
        }
        if (tokenCustomFee.tokenAmount) {
          customFee.setAmount(
            tokenCustomFee.tokenAmount * Math.pow(10, decimals),
          );
        }
        if (tokenCustomFee.denominatingTokenId) {
          customFee.setDenominatingTokenId(tokenCustomFee.denominatingTokenId);
        }
        if (tokenCustomFee.allCollectorsAreExempt) {
          customFee.setAllCollectorsAreExempt(
            tokenCustomFee.allCollectorsAreExempt,
          );
        }
        return customFee;
      },
    );
    return customFees;
  }
}
