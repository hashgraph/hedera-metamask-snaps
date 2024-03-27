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
  TransferTransaction,
} from '@hashgraph/sdk';
import { ethers } from 'ethers';
import _ from 'lodash';
import type { AtomicSwap, TxReceipt } from '../../types/hedera';
import { AssetType } from '../../types/hedera';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { Utils } from '../../utils/Utils';

export class SwapRequestCommand {
  readonly #swaps: AtomicSwap[];

  readonly #memo: string | null;

  readonly #maxFee: number | null;

  readonly #serviceFeesToPay: Record<string, number>;

  readonly #serviceFeeToAddress: string | null;

  constructor(
    swaps: AtomicSwap[],
    memo: string | null,
    maxFee: number | null,
    serviceFeesToPay: Record<string, number>,
    serviceFeeToAddress: string | null,
  ) {
    this.#swaps = swaps;
    this.#memo = memo;
    this.#maxFee = maxFee;
    this.#serviceFeesToPay = serviceFeesToPay;
    this.#serviceFeeToAddress = serviceFeeToAddress;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const serviceFeeToAddr: string = this.#serviceFeeToAddress ?? '0.0.98'; // 0.0.98 is Hedera Fee collection account

    const transaction = new TransferTransaction().setTransactionMemo(
      this.#memo ?? '',
    );

    if (this.#maxFee) {
      transaction.setMaxTransactionFee(new Hbar(this.#maxFee.toFixed(8)));
    }

    for (const swap of this.#swaps) {
      this.#processSwap(transaction, swap, client, serviceFeeToAddr);
    }

    transaction.freezeWith(client);

    const txResponse = await transaction.execute(client);

    const receipt = await txResponse.getReceipt(client);

    let newExchangeRate;
    if (receipt.exchangeRate) {
      newExchangeRate = {
        ...receipt.exchangeRate,
        expirationTime: Utils.timestampToString(
          receipt.exchangeRate.expirationTime,
        ),
      };
    }

    return {
      status: receipt.status.toString(),
      accountId: receipt.accountId ? receipt.accountId.toString() : '',
      fileId: receipt.fileId ? receipt.fileId : '',
      contractId: receipt.contractId ? receipt.contractId : '',
      topicId: receipt.topicId ? receipt.topicId : '',
      tokenId: receipt.tokenId ? receipt.tokenId : '',
      scheduleId: receipt.scheduleId ? receipt.scheduleId : '',
      exchangeRate: newExchangeRate,
      topicSequenceNumber: receipt.topicSequenceNumber
        ? String(receipt.topicSequenceNumber)
        : '',
      topicRunningHash: CryptoUtils.uint8ArrayToHex(receipt.topicRunningHash),
      totalSupply: receipt.totalSupply ? String(receipt.totalSupply) : '',
      scheduledTransactionId: receipt.scheduledTransactionId
        ? receipt.scheduledTransactionId.toString()
        : '',
      serials: JSON.parse(JSON.stringify(receipt.serials)),
      duplicates: JSON.parse(JSON.stringify(receipt.duplicates)),
      children: JSON.parse(JSON.stringify(receipt.children)),
    } as TxReceipt;
  }

  #processSwap(
    transaction: TransferTransaction,
    swap: AtomicSwap,
    client: Client,
    serviceFeeToAddr: string,
  ) {
    this.#processSwapReceiverData(transaction, swap, client, serviceFeeToAddr);
    // this.#processSwapSenderData(transaction, swap, client, serviceFeeToAddr);
  }

  #processSwapReceiverData(
    transaction: TransferTransaction,
    swap: AtomicSwap,
    client: Client,
    serviceFeeToAddr: string,
  ) {
    if (swap.receiver.assetType === AssetType.HBAR) {
      if (ethers.isAddress(swap.receiver.accountId)) {
        swap.receiver.accountId = `0.0.${swap.receiver.accountId.slice(2)}`;
      }
      if (ethers.isAddress(swap.sender.accountId)) {
        swap.sender.accountId = `0.0.${swap.sender.accountId.slice(2)}`;
      }

      transaction.addHbarTransfer(
        swap.receiver.accountId,
        swap.receiver.amount,
      );

      if (_.isEmpty(swap.sender.accountId)) {
        transaction.addHbarTransfer(
          client.operatorAccountId as AccountId,
          -swap.receiver.amount,
        );
      } else {
        transaction.addApprovedHbarTransfer(
          swap.sender.accountId,
          -swap.receiver.amount,
        );
      }

      // Service Fee
      if (this.#serviceFeesToPay[swap.receiver.assetType] > 0) {
        transaction.addHbarTransfer(
          serviceFeeToAddr,
          this.#serviceFeesToPay[swap.receiver.assetType],
        );
        transaction.addHbarTransfer(
          client.operatorAccountId as AccountId,
          -this.#serviceFeesToPay[swap.receiver.assetType],
        );
      }
    } else if (swap.receiver.assetType === 'TOKEN') {
      const assetId = swap.receiver.assetId as string;
      const multiplier = Math.pow(10, swap.receiver.decimals as number);

      transaction.addTokenTransfer(
        assetId,
        swap.receiver.accountId,
        swap.receiver.amount * multiplier,
      );
      if (_.isEmpty(swap.sender.accountId)) {
        transaction.addTokenTransfer(
          assetId,
          client.operatorAccountId as AccountId,
          -(swap.receiver.amount * multiplier),
        );
      } else {
        transaction.addApprovedTokenTransfer(
          assetId,
          swap.sender.accountId,
          -(swap.receiver.amount * multiplier),
        );
      }

      // Service Fee
      if (this.#serviceFeesToPay[assetId] > 0) {
        transaction.addTokenTransfer(
          assetId,
          serviceFeeToAddr,
          this.#serviceFeesToPay[assetId] * multiplier,
        );
        transaction.addTokenTransfer(
          assetId,
          client.operatorAccountId as AccountId,
          -(this.#serviceFeesToPay[assetId] * multiplier),
        );
      }
    } else if (swap.receiver.assetType === AssetType.NFT) {
      const assetId = NftId.fromString(swap.receiver.assetId as string);
      if (_.isEmpty(swap.sender.accountId)) {
        transaction.addNftTransfer(
          assetId,
          client.operatorAccountId as AccountId,
          swap.receiver.accountId,
        );
      } else {
        transaction.addApprovedNftTransfer(
          assetId,
          swap.sender.accountId,
          swap.receiver.accountId,
        );
      }
    }
  }

  #processSwapSenderData(
    transaction: TransferTransaction,
    swap: AtomicSwap,
    client: Client,
    serviceFeeToAddr: string,
  ) {
    if (swap.sender.assetType === AssetType.HBAR) {
      if (ethers.isAddress(swap.sender.accountId)) {
        swap.sender.accountId = `0.0.${swap.sender.accountId.slice(2)}`;
      }
      if (ethers.isAddress(swap.receiver.accountId)) {
        swap.receiver.accountId = `0.0.${swap.receiver.accountId.slice(2)}`;
      }

      transaction.addHbarTransfer(swap.sender.accountId, swap.sender.amount);

      if (_.isEmpty(swap.receiver.accountId)) {
        transaction.addHbarTransfer(
          client.operatorAccountId as AccountId,
          -swap.sender.amount,
        );
      } else {
        transaction.addApprovedHbarTransfer(
          swap.receiver.accountId,
          -swap.sender.amount,
        );
      }

      // Service Fee
      if (this.#serviceFeesToPay[swap.sender.assetType] > 0) {
        transaction.addHbarTransfer(
          serviceFeeToAddr,
          this.#serviceFeesToPay[swap.sender.assetType],
        );
        transaction.addHbarTransfer(
          client.operatorAccountId as AccountId,
          -this.#serviceFeesToPay[swap.sender.assetType],
        );
      }
    } else if (swap.sender.assetType === 'TOKEN') {
      const assetId = swap.sender.assetId as string;
      const multiplier = Math.pow(10, swap.sender.decimals as number);

      transaction.addTokenTransfer(
        assetId,
        swap.sender.accountId,
        swap.sender.amount * multiplier,
      );
      if (_.isEmpty(swap.receiver.accountId)) {
        transaction.addTokenTransfer(
          assetId,
          client.operatorAccountId as AccountId,
          -(swap.sender.amount * multiplier),
        );
      } else {
        transaction.addApprovedTokenTransfer(
          assetId,
          swap.receiver.accountId,
          -(swap.sender.amount * multiplier),
        );
      }

      // Service Fee
      if (this.#serviceFeesToPay[assetId] > 0) {
        transaction.addTokenTransfer(
          assetId,
          serviceFeeToAddr,
          this.#serviceFeesToPay[assetId] * multiplier,
        );
        transaction.addTokenTransfer(
          assetId,
          client.operatorAccountId as AccountId,
          -(this.#serviceFeesToPay[assetId] * multiplier),
        );
      }
    } else if (swap.sender.assetType === AssetType.NFT) {
      const assetId = NftId.fromString(swap.sender.assetId as string);
      if (_.isEmpty(swap.receiver.accountId)) {
        transaction.addNftTransfer(
          assetId,
          client.operatorAccountId as AccountId,
          swap.sender.accountId,
        );
      } else {
        transaction.addApprovedNftTransfer(
          assetId,
          swap.receiver.accountId,
          swap.sender.accountId,
        );
      }
    }
  }
}
