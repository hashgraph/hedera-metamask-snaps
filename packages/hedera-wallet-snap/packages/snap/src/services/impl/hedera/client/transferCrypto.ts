/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Tuum Tech
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
  AccountId,
  Hbar,
  TransferTransaction,
  type Client,
} from '@hashgraph/sdk';

import { ethers } from 'ethers';
import { uint8ArrayToHex } from '../../../../utils/crypto';
import { timestampToString } from '../../../../utils/helper';
import { AccountBalance, SimpleTransfer, TxReceipt } from '../../../hedera';

/**
 * Transfer crypto(hbar or other tokens).
 *
 * @param client - Hedera Client.
 * @param options - Transfer crypto options.
 * @param options.currentBalance - Current Balance to use to retrieve from snap state.
 * @param options.transfers - The list of transfers to take place.
 * @param options.memo - Memo to include in the transfer.
 * @param options.maxFee - Max fee to use in the transfer.
 * @param options.serviceFeesToPay - Service Fees to pay.
 * @param options.serviceFeeToAddress - The address to send the fee to.
 * @param options.onBeforeConfirm - Function to execute before confirmation.
 */
export async function transferCrypto(
  client: Client,
  options: {
    currentBalance: AccountBalance;
    transfers: SimpleTransfer[];
    memo: string | null;
    maxFee: number | null; // hbar
    serviceFeesToPay: Record<string, number>;
    serviceFeeToAddress: string | null;
    onBeforeConfirm?: () => void;
  },
): Promise<TxReceipt> {
  const serviceFeeToAddr: string = options.serviceFeeToAddress ?? '0.0.98'; // 0.0.98 is Hedera Fee collection account

  const transaction = new TransferTransaction().setTransactionMemo(
    options.memo ?? '',
  );

  if (options.maxFee) {
    transaction.setMaxTransactionFee(new Hbar(options.maxFee.toFixed(8)));
  }

  for (const transfer of options.transfers) {
    if (transfer.assetType === 'HBAR') {
      if (ethers.isAddress(transfer.to)) {
        transfer.to = `0.0.${transfer.to.slice(2)}`;
      }

      transaction.addHbarTransfer(transfer.to, transfer.amount);
      transaction.addHbarTransfer(
        client.operatorAccountId as AccountId,
        -transfer.amount,
      );

      // Service Fee
      if (options.serviceFeesToPay[transfer.assetType] > 0) {
        transaction.addHbarTransfer(
          serviceFeeToAddr,
          options.serviceFeesToPay[transfer.assetType],
        );
        transaction.addHbarTransfer(
          client.operatorAccountId as AccountId,
          -options.serviceFeesToPay[transfer.assetType],
        );
      }
    } else if (transfer.assetType === 'TOKEN') {
      const assetid = transfer.assetId as string;
      const decimals = options.currentBalance.tokens[assetid]
        ? options.currentBalance.tokens[assetid].decimals
        : 0;
      transaction.addTokenTransferWithDecimals(
        assetid,
        transfer.to,
        transfer.amount,
        decimals,
      );
      transaction.addTokenTransferWithDecimals(
        assetid,
        client.operatorAccountId as AccountId,
        -transfer.amount,
        decimals,
      );

      // Service Fee
      if (options.serviceFeesToPay[assetid] > 0) {
        transaction.addTokenTransferWithDecimals(
          assetid,
          serviceFeeToAddr,
          options.serviceFeesToPay[assetid],
          decimals,
        );
        transaction.addTokenTransferWithDecimals(
          assetid,
          client.operatorAccountId as AccountId,
          -options.serviceFeesToPay[assetid],
          decimals,
        );
      }
    } else if (transfer.assetType === 'NFT') {
      const assetid = transfer.assetId as string;
      transaction.addNftTransfer(
        assetid,
        client.operatorAccountId as AccountId,
        transfer.to,
      );
    }
  }

  transaction.freezeWith(client);

  const txResponse = await transaction.execute(client);

  options.onBeforeConfirm?.();

  const receipt = await txResponse.getReceipt(client);

  let newExchangeRate;
  if (receipt.exchangeRate) {
    newExchangeRate = {
      ...receipt.exchangeRate,
      expirationTime: timestampToString(receipt.exchangeRate.expirationTime),
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
    topicRunningHash: uint8ArrayToHex(receipt.topicRunningHash),
    totalSupply: receipt.totalSupply ? String(receipt.totalSupply) : '',
    scheduledTransactionId: receipt.scheduledTransactionId
      ? receipt.scheduledTransactionId.toString()
      : '',
    serials: JSON.parse(JSON.stringify(receipt.serials)),
    duplicates: JSON.parse(JSON.stringify(receipt.duplicates)),
    children: JSON.parse(JSON.stringify(receipt.children)),
  } as TxReceipt;
}
