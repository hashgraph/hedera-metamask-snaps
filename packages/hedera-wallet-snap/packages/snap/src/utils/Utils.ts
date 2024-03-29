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

import type { TxReceipt } from '../types/hedera';
import type { TransactionReceipt } from '@hashgraph/sdk';
import { CryptoUtils } from './CryptoUtils';

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

  public static formatTransactionReceipt(
    receipt: TransactionReceipt,
  ): TxReceipt {
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
}
