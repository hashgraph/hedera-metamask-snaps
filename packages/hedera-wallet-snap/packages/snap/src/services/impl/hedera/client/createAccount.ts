import {
  AccountCreateTransaction,
  Hbar,
  PublicKey,
  TransactionReceipt,
  TransferTransaction,
  type Client,
} from '@hashgraph/sdk';

import { isValidEthereumPublicKey } from '../../../../utils/keyPair';
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
 * @param options.onBeforeConfirm - Function to execute before confirmation.
 */
export async function createAccount(
  client: Client,
  options: {
    currentBalance: AccountBalance;
    transfers: SimpleTransfer[];
    memo: string | null;
    maxFee: number | null; // tinybars
    onBeforeConfirm?: () => void;
  },
): Promise<TxReceipt> {
  const maxFee = options.maxFee ? new Hbar(options.maxFee) : new Hbar(10);

  const transaction = new TransferTransaction()
    .setTransactionMemo(options.memo ?? '')
    .setMaxTransactionFee(maxFee);

  let newAccountCreated = false;
  const receipts: TransactionReceipt[] = [];
  let outgoingHbarAmount = 0;
  for (const transfer of options.transfers) {
    if (transfer.asset === 'HBAR') {
      if (isValidEthereumPublicKey(transfer.to)) {
        const tx = new AccountCreateTransaction()
          .setInitialBalance(Hbar.fromTinybars(transfer.amount))
          .setMaxTransactionFee(maxFee)
          .setKey(PublicKey.fromString(transfer.to))
          .freezeWith(client);

        const txResponse = await tx.execute(client);
        console.log('TxResponse: ', JSON.stringify(txResponse, null, 4));

        options.onBeforeConfirm?.();

        const receipt = await txResponse.getReceipt(client);

        receipts.push(receipt);
        newAccountCreated = true;
      } else {
        transaction.addHbarTransfer(transfer.to, transfer.amount);
        outgoingHbarAmount += -transfer.amount;
      }
    } else {
      const multiplier = Math.pow(
        10,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        options.currentBalance.tokens![transfer.asset].decimals,
      );
      const amount = transfer.amount * multiplier;

      transaction.addTokenTransfer(
        transfer.asset,
        transfer.to,
        transfer.amount,
      );

      transaction.addTokenTransfer(
        transfer.asset,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        client.operatorAccountId!,
        -amount,
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

  let receipt: TransactionReceipt;
  if (newAccountCreated) {
    receipt = receipts[0];
  } else {
    transaction.freezeWith(client);

    const txResponse = await transaction.execute(client);

    options.onBeforeConfirm?.();

    receipt = await txResponse.getReceipt(client);
  }

  console.log('receipt: ', JSON.stringify(receipt, null, 4));

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
