import { Hbar, TransferTransaction, type Client } from '@hashgraph/sdk';

import { ethers } from 'ethers';
import {
  AccountBalance,
  SimpleTransfer,
  TxReceipt,
  TxReceiptExchangeRate,
} from '../../../hedera';

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
    serviceFeesToPay: Record<string, number> | null;
    serviceFeeToAddress: string | null;
    onBeforeConfirm?: () => void;
  },
): Promise<TxReceipt> {
  const maxFee = options.maxFee
    ? new Hbar(options.maxFee.toFixed(8))
    : new Hbar(1);

  let serviceFeeToAddr: string =
    options.serviceFeeToAddress ?? '0x0000000000000000000000000000000000000000';
  if (ethers.isAddress(serviceFeeToAddr)) {
    serviceFeeToAddr = `0.0.${serviceFeeToAddr.slice(2)}`;
  }

  const transaction = new TransferTransaction()
    .setTransactionMemo(options.memo ?? '')
    .setMaxTransactionFee(maxFee);

  let outgoingHbarAmount = 0;
  for (const transfer of options.transfers) {
    if (transfer.asset === 'HBAR') {
      if (ethers.isAddress(transfer.to)) {
        transfer.to = `0.0.${transfer.to.slice(2)}`;
      }

      transaction.addHbarTransfer(transfer.to, transfer.amount);
      outgoingHbarAmount += -transfer.amount;

      // Service Fee
      if (options.serviceFeesToPay) {
        transaction.addHbarTransfer(
          serviceFeeToAddr,
          options.serviceFeesToPay[transfer.asset],
        );
        outgoingHbarAmount += -options.serviceFeesToPay[transfer.asset];
      }
    } else {
      const multiplier = Math.pow(
        10,
        options.currentBalance.tokens[transfer.asset].decimals,
      );

      transaction.addTokenTransfer(
        transfer.asset,
        transfer.to,
        transfer.amount * multiplier,
      );

      let amountToReduce = -(transfer.amount * multiplier);

      // Service Fee
      if (options.serviceFeesToPay) {
        transaction.addTokenTransfer(
          transfer.asset,
          serviceFeeToAddr,
          options.serviceFeesToPay[transfer.asset] * multiplier,
        );
        amountToReduce += -(
          options.serviceFeesToPay[transfer.asset] * multiplier
        );
      }

      transaction.addTokenTransfer(
        transfer.asset,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        client.operatorAccountId!,
        amountToReduce,
      );
    }
  }

  if (outgoingHbarAmount !== 0) {
    transaction.addHbarTransfer(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      client.operatorAccountId!,
      new Hbar(outgoingHbarAmount),
    );
  }

  transaction.freezeWith(client);

  const txResponse = await transaction.execute(client);

  options.onBeforeConfirm?.();

  const receipt = await txResponse.getReceipt(client);

  const uint8ArrayToHex = (data: Uint8Array | null | undefined) => {
    if (!data) {
      return '';
    }
    return data.reduce(
      (str, byte) => str + byte.toString(16).padStart(2, '0'),
      '',
    );
  };

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
