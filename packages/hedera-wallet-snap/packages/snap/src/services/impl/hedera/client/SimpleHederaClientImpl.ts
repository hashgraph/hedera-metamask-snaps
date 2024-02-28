/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2023 Tuum Tech
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
  AccountAllowanceApproveTransaction,
  AccountBalanceQuery,
  AccountDeleteTransaction,
  type AccountId,
  type Client,
  Hbar,
  HbarUnit,
  type PrivateKey,
  type PublicKey,
} from '@hashgraph/sdk';

import { AccountInfo } from '../../../../types/account';
import {
  SimpleHederaClient,
  SimpleTransfer,
  TxReceipt,
} from '../../../../types/hedera';
import {
  ApproveAllowanceAssetDetail,
  TokenCustomFee,
} from '../../../../types/params';
import { deleteAllowance } from './deleteAllowance';
import { getAccountInfo } from './getAccountInfo';
import { associateTokens } from './hts/associateTokens';
import { createToken } from './hts/createToken';
import { stakeHbar } from './stakeHbar';
import { transferCrypto } from './transferCrypto';
import { Utils } from '../../../../utils/Utils';
import { CryptoUtils } from '../../../../utils/CryptoUtils';

export class SimpleHederaClientImpl implements SimpleHederaClient {
  // eslint-disable-next-line no-restricted-syntax
  private readonly _client: Client;

  // eslint-disable-next-line no-restricted-syntax
  private readonly _privateKey: PrivateKey | null;

  constructor(client: Client, privateKey: PrivateKey | null) {
    this._client = client;
    this._privateKey = privateKey;
  }

  close() {
    this._client.close();
  }

  getClient(): Client {
    return this._client;
  }

  getPrivateKey(): PrivateKey | null {
    return this._privateKey;
  }

  getPublicKey(): PublicKey {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    return this._client.operatorPublicKey!;
  }

  getAccountId(): AccountId {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    return this._client.operatorAccountId!;
  }

  async getAccountInfo(accountId: string): Promise<AccountInfo> {
    return getAccountInfo(this._client, accountId);
  }

  async getAccountBalance(): Promise<number> {
    return this.#getAccountBalance(this._client);
  }

  async transferCrypto(options: {
    transfers: SimpleTransfer[];
    memo: string | null;
    maxFee: number | null;
    serviceFeesToPay: Record<string, number>;
    serviceFeeToAddress: string | null;
    onBeforeConfirm?: () => void;
  }): Promise<TxReceipt> {
    return transferCrypto(this._client, options);
  }

  async stakeHbar(options: {
    nodeId: number | null;
    accountId: string | null;
  }): Promise<TxReceipt> {
    return stakeHbar(this._client, options);
  }

  async approveAllowance(options: {
    spenderAccountId: string;
    amount: number;
    assetType: string;
    assetDetail?: ApproveAllowanceAssetDetail;
  }): Promise<TxReceipt> {
    return this.#approveAllowance(this._client, options);
  }

  async deleteAllowance(options: {
    assetType: string;
    assetId: string;
    spenderAccountId?: string;
  }): Promise<TxReceipt> {
    return deleteAllowance(this._client, options);
  }

  async deleteAccount(options: {
    transferAccountId: string;
  }): Promise<TxReceipt> {
    return this.#deleteAccount(this._client, options);
  }

  async associateTokens(options: { tokenIds: string[] }): Promise<TxReceipt> {
    return associateTokens(this._client, options);
  }

  async createToken(options: {
    assetType: 'TOKEN' | 'NFT';
    name: string;
    symbol: string;
    decimals: number;
    supplyType: 'FINITE' | 'INFINITE';
    initialSupply: number;
    maxSupply: number;
    expirationTime: string | undefined;
    autoRenewAccountId: string;
    tokenMemo: string;
    freezeDefault: boolean;
    kycPublicKey: string | undefined;
    freezePublicKey: string | undefined;
    pausePublicKey: string | undefined;
    wipePublicKey: string | undefined;
    supplyPublicKey: string | undefined;
    feeSchedulePublicKey: string | undefined;
    customFees: TokenCustomFee[] | undefined;
  }): Promise<TxReceipt> {
    return createToken(this._client, this._privateKey as PrivateKey, options);
  }

  async #getAccountBalance(client: Client): Promise<number> {
    // Create the account balance query
    const query = new AccountBalanceQuery().setAccountId(
      client.operatorAccountId as AccountId,
    );

    // Submit the query to a Hedera network
    const accountBalance = await query.execute(client);

    const amount = accountBalance.hbars.to(HbarUnit.Hbar);
    return amount.toNumber();
  }

  async #approveAllowance(
    client: Client,
    options: {
      spenderAccountId: string;
      amount: number;
      assetType: string;
      assetDetail?: ApproveAllowanceAssetDetail;
    },
  ): Promise<TxReceipt> {
    const transaction = new AccountAllowanceApproveTransaction();

    if (options.assetType === 'HBAR') {
      transaction.approveHbarAllowance(
        client.operatorAccountId as AccountId,
        options.spenderAccountId,
        new Hbar(options.amount),
      );
    } else if (options.assetType === 'TOKEN') {
      const multiplier = Math.pow(
        10,
        options.assetDetail?.assetDecimals as number,
      );
      transaction.approveTokenAllowance(
        options.assetDetail?.assetId as string,
        client.operatorAccountId as AccountId,
        options.spenderAccountId,
        options.amount * multiplier,
      );
    } else if (options.assetType === 'NFT') {
      if (options.assetDetail?.all) {
        transaction.approveTokenNftAllowanceAllSerials(
          options.assetDetail?.assetId,
          client.operatorAccountId as AccountId,
          options.spenderAccountId,
        );
      } else {
        transaction.approveTokenNftAllowance(
          options.assetDetail?.assetId as string,
          client.operatorAccountId as AccountId,
          options.spenderAccountId,
        );
      }
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

  async #deleteAccount(
    client: Client,
    options: {
      transferAccountId: string;
    },
  ): Promise<TxReceipt> {
    const transaction = new AccountDeleteTransaction()
      .setAccountId(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        client.operatorAccountId!,
      )
      .setTransferAccountId(options.transferAccountId)
      .freezeWith(client);

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
