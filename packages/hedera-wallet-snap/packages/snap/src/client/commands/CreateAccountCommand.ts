import {
  AccountBalance,
  SimpleTransfer,
  TxReceipt,
  TxReceiptExchangeRate,
} from '../../types/hedera';
import {
  AccountCreateTransaction,
  AccountId,
  Client,
  Hbar,
  PublicKey,
  TransactionReceipt,
  TransferTransaction,
} from '@hashgraph/sdk';
import { CryptoUtils } from '../../utils/CryptoUtils';

export class CreateAccountCommand {
  readonly #currentBalance: AccountBalance;

  readonly #transfers: SimpleTransfer[];

  readonly #memo: string | null;

  readonly #maxFee: number | null; // hbar

  readonly #onBeforeConfirm?: () => void;

  constructor(
    currentBalance: AccountBalance,
    transfers: SimpleTransfer[],
    memo: string | null,
    maxFee: number | null,
    onBeforeConfirm?: () => void,
  ) {
    this.#currentBalance = currentBalance;
    this.#transfers = transfers;
    this.#memo = memo;
    this.#maxFee = maxFee;
    this.#onBeforeConfirm = onBeforeConfirm;
  }

  async execute(client: Client): Promise<TxReceipt> {
    const transaction = new TransferTransaction().setTransactionMemo(
      this.#memo ?? '',
    );

    if (this.#maxFee) {
      transaction.setMaxTransactionFee(new Hbar(this.#maxFee.toFixed(8)));
    }

    let newAccountCreated = false;
    const receipts: TransactionReceipt[] = [];
    let outgoingHbarAmount = 0;
    for (const transfer of this.#transfers) {
      if (transfer.assetType === 'HBAR') {
        if (CryptoUtils.isValidEthereumPublicKey(transfer.to)) {
          const tx = new AccountCreateTransaction()
            .setInitialBalance(Hbar.fromTinybars(transfer.amount))
            .setKey(PublicKey.fromString(transfer.to));

          if (this.#maxFee) {
            tx.setMaxTransactionFee(new Hbar(this.#maxFee.toFixed(8)));
          }
          tx.freezeWith(client);

          const txResponse = await tx.execute(client);

          this.#onBeforeConfirm?.();

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
          this.#currentBalance.tokens[assetid].decimals,
        );
        transaction.addTokenTransferWithDecimals(
          assetid,
          client.operatorAccountId as AccountId,
          transfer.amount,
          this.#currentBalance.tokens[assetid].decimals,
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

      this.#onBeforeConfirm?.();

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
}
