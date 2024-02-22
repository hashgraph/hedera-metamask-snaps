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
  CustomFixedFee,
  Hbar,
  PrivateKey,
  PublicKey,
  TokenCreateTransaction,
  TokenSupplyType,
  TokenType,
  type Client,
} from '@hashgraph/sdk';

import { TxReceipt } from '../../../../../types/hedera';
import { TokenCustomFee } from '../../../../../types/params';
import { CryptoUtils } from '../../../../../utils/CryptoUtils';
import { Utils } from '../../../../../utils/Utils';

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
export async function createToken(
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
    expirationTime: string;
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
    .setExpirationTime(new Date(options.expirationTime))
    .setAutoRenewAccountId(options.autoRenewAccountId)
    .setTokenMemo(options.tokenMemo)
    .setFreezeDefault(options.freezeDefault);

  if (options.kycPublicKey) {
    transaction.setKycKey(PublicKey.fromString(options.kycPublicKey));
  }
  if (options.freezePublicKey) {
    transaction.setKycKey(PublicKey.fromString(options.freezePublicKey));
  }
  if (options.pausePublicKey) {
    transaction.setKycKey(PublicKey.fromString(options.pausePublicKey));
  }
  if (options.wipePublicKey) {
    transaction.setKycKey(PublicKey.fromString(options.wipePublicKey));
  }
  if (options.supplyPublicKey) {
    transaction.setKycKey(PublicKey.fromString(options.supplyPublicKey));
  }
  if (options.feeSchedulePublicKey) {
    transaction.setKycKey(PublicKey.fromString(options.feeSchedulePublicKey));
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
          customFee.setDenominatingTokenId(tokenCustomFee.denominatingTokenId);
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
