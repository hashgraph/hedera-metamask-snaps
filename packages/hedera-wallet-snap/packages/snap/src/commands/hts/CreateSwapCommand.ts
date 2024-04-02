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
  type AccountId,
  type Client,
  Hbar,
  NftId,
  ScheduleCreateTransaction,
  TransferTransaction,
} from '@hashgraph/sdk';
import { ethers } from 'ethers';
import _ from 'lodash';
import type { AtomicSwap, SimpleTransfer, TxReceipt } from '../../types/hedera';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { Utils } from '../../utils/Utils';

export class CreateSwapCommand {
  readonly #atomicSwaps: AtomicSwap[];

  readonly #memo: string | null;

  readonly #maxFee: number | null;

  readonly #serviceFeesToPay: Record<string, number>;

  readonly #serviceFeeToAddress: string | null;

  constructor(
    atomicSwaps: AtomicSwap[],
    memo: string | null,
    maxFee: number | null,
    serviceFeesToPay: Record<string, number>,
    serviceFeeToAddress: string | null,
  ) {
    this.#atomicSwaps = atomicSwaps;
    this.#memo = memo;
    this.#maxFee = maxFee;
    this.#serviceFeesToPay = serviceFeesToPay;
    this.#serviceFeeToAddress = serviceFeeToAddress;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const serviceFeeToAddr: string = this.#serviceFeeToAddress ?? '0.0.98'; // 0.0.98 is Hedera Fee collection account

    const transfers: SimpleTransfer[] = [];

    for (const swap of this.#atomicSwaps) {
      transfers.push(swap.sender);
      transfers.push(swap.receiver);
    }

    const transaction = new TransferTransaction().setTransactionMemo(
      this.#memo ?? '',
    );

    if (this.#maxFee) {
      transaction.setMaxTransactionFee(new Hbar(this.#maxFee.toFixed(8)));
    }

    for (const transfer of transfers) {
      if (transfer.assetType === 'HBAR') {
        if (ethers.isAddress(transfer.to)) {
          transfer.to = `0.0.${transfer.to.slice(2)}`;
        }

        transaction.addHbarTransfer(transfer.to, transfer.amount);
        if (_.isEmpty(transfer.from)) {
          transaction.addHbarTransfer(
            client.operatorAccountId as AccountId,
            -transfer.amount,
          );
        } else {
          transaction.addApprovedHbarTransfer(
            transfer.from as string,
            -transfer.amount,
          );
        }

        // Service Fee
        if (this.#serviceFeesToPay[transfer.assetType] > 0) {
          transaction.addHbarTransfer(
            serviceFeeToAddr,
            this.#serviceFeesToPay[transfer.assetType],
          );
          transaction.addHbarTransfer(
            client.operatorAccountId as AccountId,
            -this.#serviceFeesToPay[transfer.assetType],
          );
        }
      } else if (transfer.assetType === 'TOKEN') {
        const assetid = transfer.assetId as string;
        const multiplier = Math.pow(10, transfer.decimals as number);

        transaction.addTokenTransfer(
          assetid,
          transfer.to,
          transfer.amount * multiplier,
        );
        if (_.isEmpty(transfer.from)) {
          transaction.addTokenTransfer(
            assetid,
            client.operatorAccountId as AccountId,
            -(transfer.amount * multiplier),
          );
        } else {
          transaction.addApprovedTokenTransfer(
            assetid,
            transfer.from as string,
            -(transfer.amount * multiplier),
          );
        }

        // Service Fee
        if (this.#serviceFeesToPay[assetid] > 0) {
          transaction.addTokenTransfer(
            assetid,
            serviceFeeToAddr,
            this.#serviceFeesToPay[assetid] * multiplier,
          );
          transaction.addTokenTransfer(
            assetid,
            client.operatorAccountId as AccountId,
            -(this.#serviceFeesToPay[assetid] * multiplier),
          );
        }
      } else if (transfer.assetType === 'NFT') {
        const assetid = NftId.fromString(transfer.assetId as string);
        if (_.isEmpty(transfer.from)) {
          transaction.addNftTransfer(
            assetid,
            client.operatorAccountId as AccountId,
            transfer.to,
          );
        } else {
          transaction.addApprovedNftTransfer(
            assetid,
            transfer.from as string,
            transfer.to,
          );
        }
      }
    }

    const scheduleTxResponse = await new ScheduleCreateTransaction()
      .setScheduledTransaction(transaction)
      .execute(client);

    const receipt = await scheduleTxResponse.getReceipt(client);

    return {
      scheduleId: receipt.scheduleId ? receipt.scheduleId : '',
    } as TxReceipt;
  }
}
