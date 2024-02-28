import { AccountUpdateTransaction, Client } from '@hashgraph/sdk';
import { TxReceipt } from '../../types/hedera';
import _ from 'lodash';
import { Utils } from '../../utils/Utils';
import { CryptoUtils } from '../../utils/CryptoUtils';

export class StakeHbarCommand {
  readonly #nodeId: number | null;

  readonly #accountId: string | null;

  constructor(nodeId: number | null, accountId: string | null) {
    this.#nodeId = nodeId;
    this.#accountId = accountId;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transaction = new AccountUpdateTransaction().setAccountId(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      client.operatorAccountId!,
    );

    if (_.isNull(this.#nodeId) && _.isNull(this.#accountId)) {
      transaction.setDeclineStakingReward(true);
    } else {
      if (Number.isFinite(this.#nodeId)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        transaction.setStakedNodeId(this.#nodeId!);
      }
      if (!_.isEmpty(this.#accountId)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        transaction.setStakedAccountId(this.#accountId!);
      }
      transaction.setDeclineStakingReward(false);
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
}
