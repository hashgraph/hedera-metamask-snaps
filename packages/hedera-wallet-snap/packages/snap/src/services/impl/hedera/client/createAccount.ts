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
  AccountCreateTransaction,
  AccountId,
  Hbar,
  PublicKey,
  TransactionReceipt,
  TransferTransaction,
  type Client,
} from '@hashgraph/sdk';

import { CryptoUtils } from '../../../../utils/CryptoUtils';
import {
  AccountBalance,
  SimpleTransfer,
  TxReceipt,
  TxReceiptExchangeRate,
} from '../../../../types/hedera';

/**
 * Create a new account for someone else by transferring HBAR or any other token.
 *
 * @param client - Hedera Client.
 * @param options - Transfer crypto options.
 * @param options.currentBalance - Current Balance to use to retrieve from snap state.
 * @param options.transfers - The list of transfers to take place.
 * @param options.memo - Memo to include in the transfer.
 * @param options.maxFee - Max fee to use in the transfer.
 * @param options.onBeforeConfirm - Function to execute before confirmation.
 */
export async function createAccount(
  client: Client,
  options: {
    currentBalance: AccountBalance;
    transfers: SimpleTransfer[];
    memo: string | null;
    maxFee: number | null; // hbar
    onBeforeConfirm?: () => void;
  },
): Promise<TxReceipt> {
  const transaction = new TransferTransaction().setTransactionMemo(
    options.memo ?? '',
  );

  if (options.maxFee) {
    transaction.setMaxTransactionFee(new Hbar(options.maxFee.toFixed(8)));
  }

  let newAccountCreated = false;
  const receipts: TransactionReceipt[] = [];
  let outgoingHbarAmount = 0;
  for (const transfer of options.transfers) {
    if (transfer.assetType === 'HBAR') {
      if (CryptoUtils.isValidEthereumPublicKey(transfer.to)) {
        const tx = new AccountCreateTransaction()
          .setInitialBalance(Hbar.fromTinybars(transfer.amount))
          .setKey(PublicKey.fromString(transfer.to));

        if (options.maxFee) {
          tx.setMaxTransactionFee(new Hbar(options.maxFee.toFixed(8)));
        }
        tx.freezeWith(client);

        const txResponse = await tx.execute(client);

        options.onBeforeConfirm?.();

        const receipt = await txResponse.getReceipt(client);

        receipts.push(receipt);
        newAccountCreated = true;
      } else {
        transaction.addHbarTransfer(transfer.to, transfer.amount);
        outgoingHbarAmount += -transfer.amount;
      }
      transaction.addHbarTransfer(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        client.operatorAccountId!,
        new Hbar(outgoingHbarAmount),
      );
    } else if (transfer.assetType === 'TOKEN') {
      const assetid = transfer.assetId as string;
      transaction.addTokenTransferWithDecimals(
        assetid,
        transfer.to,
        transfer.amount,
        options.currentBalance.tokens[assetid].decimals,
      );
      transaction.addTokenTransferWithDecimals(
        assetid,
        client.operatorAccountId as AccountId,
        transfer.amount,
        options.currentBalance.tokens[assetid].decimals,
      );
    } else if (transfer.assetType === 'NFT') {
      const assetid = transfer.assetId as string;
      transaction.addNftTransfer(
        assetid,
        client.operatorAccountId as AccountId,
        transfer.to,
      );
    }
  }

  let receipt: TransactionReceipt;
  if (newAccountCreated) {
    receipt = receipts[0];
  } else {
    transaction.freezeWith(client);

    const txResponse = await transaction.execute(client);

    options.onBeforeConfirm?.();

    receipt = await txResponse.getReceipt(client);
  }

  return {
    status: receipt.status.toString(),
    accountId: receipt.accountId ? receipt.accountId.toString() : '',
    fileId: receipt.fileId ? receipt.fileId : '',
    contractId: receipt.contractId ? receipt.contractId : '',
    topicId: receipt.topicId ? receipt.topicId : '',
    tokenId: receipt.tokenId ? receipt.tokenId : '',
    scheduleId: receipt.scheduleId ? receipt.scheduleId : '',
    exchangeRate: receipt.exchangeRate
      ? (JSON.parse(
          JSON.stringify(receipt.exchangeRate),
        ) as TxReceiptExchangeRate)
      : ({} as TxReceiptExchangeRate),
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
