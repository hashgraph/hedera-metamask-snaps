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

import type { AccountId, Client, PublicKey } from '@hashgraph/sdk';
import {
  Hbar,
  NftId,
  ScheduleCreateTransaction,
  ScheduleSignTransaction,
  Timestamp,
  TransferTransaction,
} from '@hashgraph/sdk';
import { ethers } from 'ethers';
import type { AtomicSwap, TxRecord } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class AtomicSwapCommand {
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

  public async initiateSwap(client: Client): Promise<TxRecord> {
    const serviceFeeToAddr: string = this.#serviceFeeToAddress ?? '0.0.98'; // 0.0.98 is Hedera Fee collection account

    const transaction = new TransferTransaction();

    if (this.#maxFee) {
      transaction.setMaxTransactionFee(new Hbar(this.#maxFee.toFixed(8)));
    }

    for (const swap of this.#atomicSwaps) {
      if (swap.requester.assetType === 'HBAR') {
        if (ethers.isAddress(swap.requester.to)) {
          swap.requester.to = `0.0.${swap.requester.to.slice(2)}`;
        }

        transaction.addHbarTransfer(swap.requester.to, swap.requester.amount);
        transaction.addHbarTransfer(
          client.operatorAccountId as AccountId,
          -swap.requester.amount,
        );

        // Service Fee
        if (this.#serviceFeesToPay[swap.requester.assetType] > 0) {
          transaction.addHbarTransfer(
            serviceFeeToAddr,
            this.#serviceFeesToPay[swap.requester.assetType],
          );
          transaction.addHbarTransfer(
            client.operatorAccountId as AccountId,
            -this.#serviceFeesToPay[swap.requester.assetType],
          );
        }
      } else if (swap.requester.assetType === 'TOKEN') {
        const assetid = swap.requester.assetId as string;
        const multiplier = Math.pow(10, swap.requester.decimals as number);

        transaction.addTokenTransfer(
          assetid,
          swap.requester.to,
          swap.requester.amount * multiplier,
        );
        transaction.addTokenTransfer(
          assetid,
          client.operatorAccountId as AccountId,
          -(swap.requester.amount * multiplier),
        );

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
      } else if (swap.requester.assetType === 'NFT') {
        const assetid = NftId.fromString(swap.requester.assetId as string);
        transaction.addNftTransfer(
          assetid,
          client.operatorAccountId as AccountId,
          swap.requester.to,
        );
      }

      if (swap.responder.assetType === 'HBAR') {
        if (ethers.isAddress(swap.responder.to)) {
          swap.responder.to = `0.0.${swap.responder.to.slice(2)}`;
        }

        transaction.addHbarTransfer(
          client.operatorAccountId as AccountId,
          swap.responder.amount,
        );

        transaction.addHbarTransfer(swap.requester.to, -swap.responder.amount);
      } else if (swap.responder.assetType === 'TOKEN') {
        const assetid = swap.responder.assetId as string;
        const multiplier = Math.pow(10, swap.responder.decimals as number);

        transaction.addTokenTransfer(
          assetid,
          client.operatorAccountId as AccountId,
          swap.responder.amount * multiplier,
        );

        transaction.addTokenTransfer(
          assetid,
          swap.requester.to,
          -swap.responder.amount * multiplier,
        );
      } else if (swap.responder.assetType === 'NFT') {
        const assetid = NftId.fromString(swap.responder.assetId as string);
        transaction.addNftTransfer(
          assetid,
          swap.requester.to,
          client.operatorAccountId as AccountId,
        );
      }
    }

    // Set the time to 30 minutes from now
    // Note: getTime() returns time in milliseconds, so 30 minutes = 30 * 60 * 1000 milliseconds
    const expirationTime = Timestamp.fromDate(
      new Date(new Date().getTime() + 30 * 60 * 1000),
    );

    const scheduledTransaction = new ScheduleCreateTransaction()
      .setScheduledTransaction(transaction)
      .setAdminKey(client.operatorPublicKey as PublicKey)
      .setPayerAccountId(client.operatorAccountId as AccountId)
      .setScheduleMemo(this.#memo ?? '')
      .setExpirationTime(expirationTime)
      .freezeWith(client);

    return await Utils.executeTransaction(client, scheduledTransaction);
  }

  public async completeSwap(
    client: Client,
    scheduleId: string,
  ): Promise<TxRecord> {
    const transaction = new ScheduleSignTransaction().setScheduleId(scheduleId);

    return await Utils.executeTransaction(client, transaction);
  }
}
