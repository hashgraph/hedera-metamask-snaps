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
  AccountCreateTransaction,
  Hbar,
  NftId,
  ScheduleCreateTransaction,
  TransferTransaction,
  KeyList,
} from '@hashgraph/sdk';
import type { PublicKey, AccountId, Client ,
  PrivateKey} from '@hashgraph/sdk';

import { ethers } from 'ethers';
import _ from 'lodash';
import type { SimpleTransfer, TxReceipt } from '../../types/hedera';

export class SwapRequestCommand {
  readonly #transfers: SimpleTransfer[];

  readonly #memo: string | null;

  readonly #maxFee: number | null;

  readonly #serviceFeesToPay: Record<string, number>;

  readonly #serviceFeeToAddress: string | null;

  readonly #recipientPublicKey: PublicKey;

  readonly #senderPublicKey: PublicKey;

  readonly #senderPrivateKey: PrivateKey;

  constructor(
    transfers: SimpleTransfer[],
    memo: string | null,
    maxFee: number | null,
    serviceFeesToPay: Record<string, number>,
    serviceFeeToAddress: string | null,
    recipientPublicKey: PublicKey,
    senderPublicKey: PublicKey,
    senderPrivateKey: PrivateKey,
  ) {
    this.#transfers = transfers;
    this.#memo = memo;
    this.#maxFee = maxFee;
    this.#serviceFeesToPay = serviceFeesToPay;
    this.#serviceFeeToAddress = serviceFeeToAddress;
    this.#recipientPublicKey = recipientPublicKey;
    this.#senderPublicKey = senderPublicKey;
    this.#senderPrivateKey = senderPrivateKey;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const serviceFeeToAddr: string = this.#serviceFeeToAddress ?? '0.0.98'; // 0.0.98 is Hedera Fee collection account

    const pubKeyList = [this.#senderPublicKey, this.#recipientPublicKey];

    const thresholdKey = new KeyList(pubKeyList, 1);

    const createTx = new AccountCreateTransaction()
      .setKey(thresholdKey)
      .setInitialBalance(new Hbar(1));

    const createTxResponse = await createTx.execute(client);
    const createTxReceipt = await createTxResponse.getReceipt(client);
    if (createTxReceipt.accountId === null) {
      throw new Error('threshold account id returned null');
    }

    const newAccountId = createTxReceipt.accountId;

    const transaction = new TransferTransaction().setTransactionMemo(
      this.#memo ?? '',
    );

    if (this.#maxFee) {
      transaction.setMaxTransactionFee(new Hbar(this.#maxFee.toFixed(8)));
    }

    for (const transfer of this.#transfers) {
      if (transfer.assetType === 'HBAR') {
        if (ethers.isAddress(transfer.to)) {
          transfer.to = `0.0.${transfer.to.slice(2)}`;
        }

        transfer.from = `0.0.1847`;

        transaction.addHbarTransfer(transfer.to, transfer.amount);

        if (_.isEmpty(transfer.from)) {
          transaction.addHbarTransfer(
            client.operatorAccountId as AccountId,
            -transfer.amount,
          );
        } else {
          transaction.addApprovedHbarTransfer(transfer.from, -transfer.amount);
        }

        transaction.addHbarTransfer(transfer.from, transfer.amount);

        if (_.isEmpty(transfer.to)) {
          transaction.addHbarTransfer(
            client.operatorAccountId as AccountId,
            -transfer.amount,
          );
        } else {
          transaction.addApprovedHbarTransfer(transfer.to, -transfer.amount);
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

    client.setOperator(newAccountId, this.#senderPrivateKey);

    const schedTx = new ScheduleCreateTransaction()
      .setScheduledTransaction(transaction)
      .freezeWith(client);

    const signedScheduleCreateTx = await schedTx.sign(this.#senderPrivateKey);

    const txResponse = await signedScheduleCreateTx.execute(client);

    const receipt = await txResponse.getReceipt(client);

    /* let newExchangeRate;
    if (receipt.exchangeRate) {
      newExchangeRate = {
        ...receipt.exchangeRate,
        expirationTime: Utils.timestampToString(
          receipt.exchangeRate.expirationTime,
        ),
      };
    }*/

    return {
      /* status: receipt.status.toString(), */
      accountId: createTxReceipt.accountId
        ? createTxReceipt.accountId.toString()
        : '',
      /*
      fileId: receipt.fileId ? receipt.fileId : '',
      contractId: receipt.contractId ? receipt.contractId : '',
      topicId: receipt.topicId ? receipt.topicId : '',
      tokenId: receipt.tokenId ? receipt.tokenId : '',*/
      scheduleId: receipt.scheduleId ? receipt.scheduleId.toString() : '',
      /*
      exchangeRate: newExchangeRate,
      topicSequenceNumber: receipt.topicSequenceNumber
        ? String(receipt.topicSequenceNumber)
        : '',
      topicRunningHash: CryptoUtils.uint8ArrayToHex(receipt.topicRunningHash),
      totalSupply: receipt.totalSupply ? String(receipt.totalSupply) : '',*/
      scheduledTransactionId: receipt.scheduledTransactionId
        ? receipt.scheduledTransactionId.toString()
        : '' /*
      serials: JSON.parse(JSON.stringify(receipt.serials)),
      duplicates: JSON.parse(JSON.stringify(receipt.duplicates)),
      children: JSON.parse(JSON.stringify(receipt.children)),*/,
    } as TxReceipt;
  }
}
