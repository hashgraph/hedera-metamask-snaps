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
  NftId,
  TransferTransaction,
  type Client,
} from '@hashgraph/sdk';

import { ethers } from 'ethers';
import _ from 'lodash';
import { SimpleTransfer, TxReceipt } from '../../../../types/hedera';
import { CryptoUtils } from '../../../../utils/CryptoUtils';
import { Utils } from '../../../../utils/Utils';

/**
 * Transfer crypto(hbar or other tokens).
 *
 * @param client - Hedera Client.
 * @param options - Transfer crypto options.
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
      if (options.serviceFeesToPay[assetid] > 0) {
        transaction.addTokenTransfer(
          assetid,
          serviceFeeToAddr,
          options.serviceFeesToPay[assetid] * multiplier,
        );
        transaction.addTokenTransfer(
          assetid,
          client.operatorAccountId as AccountId,
          -(options.serviceFeesToPay[assetid] * multiplier),
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

  transaction.freezeWith(client);

  const txResponse = await transaction.execute(client);

  options.onBeforeConfirm?.();

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
