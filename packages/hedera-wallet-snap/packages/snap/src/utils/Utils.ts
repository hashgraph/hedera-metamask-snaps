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

import { Hbar, type Client, type TransactionRecord } from '@hashgraph/sdk';
import type {
  TransactionReceiptJSON,
  TransactionRecordJSON,
} from '@hashgraph/sdk/lib/transaction/TransactionRecord';
import { EMPTY_STRING, MAX_RETRIES } from '../types/constants';
import type { TxReceipt, TxRecord } from '../types/hedera';

export class Utils {
  public static timestampToString(
    data: string | number | Date | null | undefined,
  ): string {
    if (!data) {
      return '';
    }

    let timestamp: number;
    if (data instanceof Date) {
      timestamp = data.getTime() / 1000;
    } else if (typeof data === 'string' || typeof data === 'number') {
      timestamp = parseFloat(data.toString());
    } else {
      return '';
    }

    return new Date(timestamp * 1000).toUTCString();
  }

  /**
   * Adds the prefix to the EVM address.
   * @param address - EVM Account address.
   * @returns EVM address.
   */
  public static ensure0xPrefix(address: string): string {
    let result = address;
    if (!address.startsWith('0x')) {
      result = `0x${address}`;
    }
    return result.toLowerCase();
  }

  /**
   * Capitalizes the first letter of the given string.
   * @param string - The string to capitalize.
   * @returns The string with the first letter capitalized.
   */
  public static capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  public static formatTransactionReceipt = (
    receipt: TransactionReceiptJSON,
  ): TxReceipt => {
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
      status: receipt.status,
      accountId: receipt.accountId ? receipt.accountId : EMPTY_STRING,
      fileId: receipt.filedId ? receipt.filedId : EMPTY_STRING,
      contractId: receipt.contractId ? receipt.contractId : EMPTY_STRING,
      topicId: receipt.topicId ? receipt.topicId : EMPTY_STRING,
      tokenId: receipt.tokenId ? receipt.tokenId : EMPTY_STRING,
      scheduleId: receipt.scheduleId ? receipt.scheduleId : EMPTY_STRING,
      exchangeRate: newExchangeRate,
      topicSequenceNumber: receipt.topicSequenceNumber
        ? receipt.topicSequenceNumber.toString()
        : EMPTY_STRING,
      topicRunningHash: receipt.topicRunningHash
        ? receipt.topicRunningHash
        : EMPTY_STRING,
      totalSupply: receipt.totalSupply
        ? receipt.totalSupply.toString()
        : EMPTY_STRING,
      scheduledTransactionId: receipt.scheduledTransactionId
        ? receipt.scheduledTransactionId
        : EMPTY_STRING,
      serials: receipt.serials,
      duplicates: receipt.duplicates
        ? receipt.duplicates.map(this.formatTransactionReceipt)
        : [],
      children: receipt.children
        ? receipt.children.map(this.formatTransactionReceipt)
        : [],
    } as TxReceipt;
  };

  public static formatTransactionRecord = (
    record: TransactionRecordJSON,
  ): TxRecord => {
    return {
      receipt: Utils.formatTransactionReceipt(record.receipt),
      transactionHash: record.transactionHash
        ? record.transactionHash
        : EMPTY_STRING,
      consensusTimestamp: Utils.timestampToString(record.consensusTimestamp),
      transactionId: record.transactionId,
      transactionMemo: record.transactionMemo,
      transactionFee: Hbar.fromTinybars(record.transactionFee).toString(),
      transfers: record.transfers
        ? record.transfers.map((transfer) => ({
            ...transfer,
            amount: Hbar.fromTinybars(transfer.amount).toString(),
          }))
        : [],
      scheduleRef: record.scheduleRef ? record.scheduleRef : EMPTY_STRING,
      parentConsensusTimestamp: Utils.timestampToString(
        record.parentConsensusTimestamp,
      ),
      aliasKey: record.aliasKey ? record.aliasKey : EMPTY_STRING,
      ethereumHash: record.ethereumHash ? record.ethereumHash : EMPTY_STRING,
      prngBytes: record.prngBytes ? record.prngBytes : EMPTY_STRING,
      prngNumber: record.prngNumber
        ? record.prngNumber.toString()
        : EMPTY_STRING,
      evmAddress: record.evmAddress ? record.evmAddress : EMPTY_STRING,
      duplicates: record.duplicates
        ? record.duplicates.map((duplicate) =>
            Utils.formatTransactionRecord(duplicate.toJSON()),
          )
        : [],
      children: record.children
        ? record.children.map((child) =>
            Utils.formatTransactionRecord(child.toJSON()),
          )
        : [],
    } as TxRecord;
  };

  public static async executeTransaction(
    client: Client,
    transaction: any,
  ): Promise<TxRecord> {
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const txResponse = await transaction.execute(client);
        const record: TransactionRecord = await txResponse.getRecord(client);
        const recordJson: TransactionRecordJSON = record.toJSON();
        return Utils.formatTransactionRecord(recordJson);
      } catch (error: any) {
        // If the error is BUSY, retry the transaction
        if (error.toString().includes('BUSY')) {
          retries += 1;
          console.log(`Retry attempt: ${retries}`);
        } else {
          // if the error is not BUSY, throw the error
          throw error;
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Transaction failed after ${MAX_RETRIES} attempts`);
  }
}
