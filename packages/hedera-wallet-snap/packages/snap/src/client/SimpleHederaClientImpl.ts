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
  AccountAllowanceDeleteTransaction,
  AccountBalanceQuery,
  AccountDeleteTransaction,
  type AccountId,
  AccountInfoQuery,
  AccountUpdateTransaction,
  type Client,
  CustomFixedFee,
  Hbar,
  HbarUnit,
  NftId,
  type PrivateKey,
  PublicKey,
  TokenAssociateTransaction,
  TokenCreateTransaction,
  TokenSupplyType,
  TokenType,
  TransferTransaction,
} from '@hashgraph/sdk';

import { AccountInfo } from '../types/account';
import { SimpleHederaClient, SimpleTransfer, TxReceipt } from '../types/hedera';
import { ApproveAllowanceAssetDetail, TokenCustomFee } from '../types/params';
import { Utils } from '../utils/Utils';
import { CryptoUtils } from '../utils/CryptoUtils';
import {
  AccountInfoJson,
  StakingInfoJson,
} from '@hashgraph/sdk/lib/account/AccountInfo';
import _ from 'lodash';
import { ethers } from 'ethers';

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
    return this.#getAccountInfo(this._client, accountId);
  }

  async getAccountBalance(): Promise<number> {
    return this.#getAccountBalance(this._client);
  }

  async deleteAllowance(options: {
    assetType: string;
    assetId: string;
    spenderAccountId?: string;
  }): Promise<TxReceipt> {
    return this.#deleteAllowance(this._client, options);
  }

  async deleteAccount(options: {
    transferAccountId: string;
  }): Promise<TxReceipt> {
    return this.#deleteAccount(this._client, options);
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
    return this.#createToken(
      this._client,
      this._privateKey as PrivateKey,
      options,
    );
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

  async #deleteAllowance(
    client: Client,
    options: {
      assetType: string;
      assetId: string;
      spenderAccountId?: string;
    },
  ): Promise<TxReceipt> {
    let transaction:
      | AccountAllowanceApproveTransaction
      | AccountAllowanceDeleteTransaction;

    if (options.assetType === 'HBAR' || options.assetType === 'TOKEN') {
      transaction = new AccountAllowanceApproveTransaction();
      if (options.assetType === 'HBAR') {
        transaction.approveHbarAllowance(
          client.operatorAccountId as AccountId,
          options.spenderAccountId as string,
          0,
        );
      } else {
        transaction.approveTokenAllowance(
          options.assetId,
          client.operatorAccountId as AccountId,
          options.spenderAccountId as string,
          0,
        );
      }
    } else {
      transaction =
        new AccountAllowanceDeleteTransaction().deleteAllTokenNftAllowances(
          options.assetId,
          client.operatorAccountId as AccountId,
        );
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

  async #getAccountInfo(
    client: Client,
    accountId: string,
  ): Promise<AccountInfo> {
    // Create the account info query
    const query = new AccountInfoQuery({ accountId });
    await query.getCost(client);

    const accountInfo = await query.execute(client);
    const accountInfoJson: AccountInfoJson = accountInfo.toJSON();

    const hbarBalance = Number(accountInfoJson.balance.replace(' ℏ', ''));
    const stakingInfo = {} as StakingInfoJson;
    if (accountInfoJson.stakingInfo) {
      stakingInfo.declineStakingReward =
        accountInfoJson.stakingInfo.declineStakingReward;

      stakingInfo.stakePeriodStart = Utils.timestampToString(
        accountInfoJson.stakingInfo.stakePeriodStart,
      );

      stakingInfo.pendingReward = Hbar.fromString(
        accountInfoJson.stakingInfo.pendingReward ?? '0',
      )
        .toString(HbarUnit.Hbar)
        .replace(' ℏ', '');
      stakingInfo.stakedToMe = Hbar.fromString(
        accountInfoJson.stakingInfo.stakedToMe ?? '0',
      )
        .toString(HbarUnit.Hbar)
        .replace(' ℏ', '');
      stakingInfo.stakedAccountId =
        accountInfoJson.stakingInfo.stakedAccountId ?? '';
      stakingInfo.stakedNodeId = accountInfoJson.stakingInfo.stakedNodeId ?? '';
    }

    return {
      accountId: accountInfoJson.accountId,
      alias: accountInfoJson.aliasKey ?? '',
      expirationTime: Utils.timestampToString(accountInfoJson.expirationTime),
      memo: accountInfoJson.accountMemo,
      evmAddress: accountInfoJson.contractAccountId
        ? `0x${accountInfoJson.contractAccountId}`
        : '',
      key: {
        key: accountInfoJson.key
          ? PublicKey.fromString(accountInfoJson.key).toStringRaw()
          : '',
      },
      balance: {
        hbars: hbarBalance,
        timestamp: Utils.timestampToString(new Date()),
      },
      autoRenewPeriod: accountInfo.autoRenewPeriod.seconds.toString(),
      ethereumNonce: accountInfoJson.ethereumNonce ?? '',
      isDeleted: accountInfoJson.isDeleted,
      stakingInfo,
    } as AccountInfo;
  }

  /**
   * Create a token on Hedera.
   *
   * @param client - Hedera Client.
   * @param privateKey - Private key of the token creator.
   * @param options - Create Token options.
   * @param options.assetType - Token assetType.
   * @param options.name - Token name.
   * @param options.symbol - Token symbol.
   * @param options.decimals - Token decimals.
   * @param options.supplyType - Token supplyType.
   * @param options.initialSupply - Token initialSupply.
   * @param options.maxSupply - Token maxSupply.
   * @param options.expirationTime - Token expirationTime.
   * @param options.autoRenewAccountId - Token autoRenewAccountId.
   * @param options.tokenMemo - Token tokenMemo.
   * @param options.freezeDefault - Token freezeDefault.
   * @param options.kycPublicKey - Token kycPublicKey.
   * @param options.freezePublicKey - Token freezePublicKey.
   * @param options.pausePublicKey - Token pausePublicKey.
   * @param options.wipePublicKey - Token wipePublicKey.
   * @param options.supplyPublicKey - Token supplyPublicKey.
   * @param options.feeSchedulePublicKey - Token feeSchedulePublicKey.
   * @param options.customFees - Token customFees.
   */
  async #createToken(
    client: Client,
    privateKey: PrivateKey,
    options: {
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
    },
  ): Promise<TxReceipt> {
    const transaction = new TokenCreateTransaction()
      .setAdminKey(client.operatorPublicKey as PublicKey)
      .setTreasuryAccountId(client.operatorAccountId as AccountId)
      .setTokenType(
        options.assetType === 'TOKEN'
          ? TokenType.FungibleCommon
          : TokenType.NonFungibleUnique,
      )
      .setTokenName(options.name)
      .setTokenSymbol(options.symbol)
      .setDecimals(options.decimals)
      .setSupplyType(
        options.supplyType === 'FINITE'
          ? TokenSupplyType.Finite
          : TokenSupplyType.Infinite,
      )
      .setInitialSupply(options.initialSupply * Math.pow(10, options.decimals))
      .setMaxSupply(options.maxSupply * Math.pow(10, options.decimals))
      .setAutoRenewAccountId(options.autoRenewAccountId)
      .setTokenMemo(options.tokenMemo)
      .setFreezeDefault(options.freezeDefault);

    if (options.expirationTime) {
      transaction.setExpirationTime(new Date(options.expirationTime));
    }
    if (options.kycPublicKey) {
      transaction.setKycKey(PublicKey.fromString(options.kycPublicKey));
    }
    if (options.freezePublicKey) {
      transaction.setFreezeKey(PublicKey.fromString(options.freezePublicKey));
    }
    if (options.pausePublicKey) {
      transaction.setPauseKey(PublicKey.fromString(options.pausePublicKey));
    }
    if (options.wipePublicKey) {
      transaction.setWipeKey(PublicKey.fromString(options.wipePublicKey));
    }
    if (options.supplyPublicKey) {
      transaction.setSupplyKey(PublicKey.fromString(options.supplyPublicKey));
    }
    if (options.feeSchedulePublicKey) {
      transaction.setFeeScheduleKey(
        PublicKey.fromString(options.feeSchedulePublicKey),
      );
    }

    if (options.customFees) {
      // Convert TokenCustomFee[] to CustomFixedFee[]
      const customFees: CustomFixedFee[] = options.customFees.map(
        (tokenCustomFee: TokenCustomFee) => {
          const customFee = new CustomFixedFee({
            feeCollectorAccountId: tokenCustomFee.feeCollectorAccountId,
          });
          if (tokenCustomFee.hbarAmount) {
            customFee.setHbarAmount(new Hbar(tokenCustomFee.hbarAmount));
          }
          if (tokenCustomFee.tokenAmount) {
            customFee.setAmount(
              tokenCustomFee.tokenAmount * Math.pow(10, options.decimals),
            );
          }
          if (tokenCustomFee.denominatingTokenId) {
            customFee.setDenominatingTokenId(
              tokenCustomFee.denominatingTokenId,
            );
          }
          if (tokenCustomFee.allCollectorsAreExempt) {
            customFee.setAllCollectorsAreExempt(
              tokenCustomFee.allCollectorsAreExempt,
            );
          }
          return customFee;
        },
      );
      transaction.setCustomFees(customFees);
    }

    transaction.freezeWith(client);

    // Sign the transaction with the token adminKey and the token treasury account private key
    const signTx = await (await transaction.sign(privateKey)).sign(privateKey);

    // Sign the transaction with the client operator private key and submit to a Hedera network
    const txResponse = await signTx.execute(client);

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
      fileId: receipt.fileId ? receipt.fileId.toString() : '',
      contractId: receipt.contractId ? receipt.contractId.toString() : '',
      topicId: receipt.topicId ? receipt.topicId.toString() : '',
      tokenId: receipt.tokenId ? receipt.tokenId.toString() : '',
      scheduleId: receipt.scheduleId ? receipt.scheduleId.toString() : '',
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
