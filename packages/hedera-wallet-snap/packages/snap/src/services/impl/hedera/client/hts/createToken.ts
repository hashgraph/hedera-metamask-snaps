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
  CustomFee,
  Key,
  PrivateKey,
  PublicKey,
  Timestamp,
  TokenCreateTransaction,
  TokenSupplyType,
  type Client,
} from '@hashgraph/sdk';

import { TxReceipt } from '../../../../../types/hedera';
import { CryptoUtils } from '../../../../../utils/CryptoUtils';
import { Utils } from '../../../../../utils/Utils';

/**
 * Create a token on Hedera.
 *
 * @param client - Hedera Client.
 * @param privateKey - Private key of the token creator.
 * @param options - Create Token options.
 * @param options.name - Token name.
 * @param options.symbol - Token symbol.
 * @param options.decimals - Token decimals.
 * @param options.initialSupply - Token initialSupply.
 * @param options.kycPublicKey - Token kycPublicKey.
 * @param options.freezePublicKey - Token freezePublicKey.
 * @param options.pausePublicKey - Token pausePublicKey.
 * @param options.wipePublicKey - Token wipePublicKey.
 * @param options.supplyPublicKey - Token supplyPublicKey.
 * @param options.feeSchedulePublicKey - Token feeSchedulePublicKey.
 * @param options.freezeDefault - Token freezeDefault.
 * @param options.expirationTime - Token expirationTime.
 * @param options.autoRenewAccountId - Token autoRenewAccountId.
 * @param options.tokenMemo - Token tokenMemo.
 * @param options.customFees - Token customFees.
 * @param options.supplyType - Token supplyType.
 * @param options.maxSupply - Token maxSupply.
 */
export async function createToken(
  client: Client,
  privateKey: PrivateKey,
  options: {
    name: string;
    symbol: string;
    decimals: number;
    initialSupply: number;
    kycPublicKey: Key;
    freezePublicKey: Key;
    pausePublicKey: Key;
    wipePublicKey: Key;
    supplyPublicKey: Key;
    feeSchedulePublicKey: Key;
    freezeDefault: boolean;
    expirationTime: Timestamp | Date;
    autoRenewAccountId: string;
    tokenMemo: string;
    customFees: CustomFee[];
    supplyType: TokenSupplyType;
    maxSupply: number;
  },
): Promise<TxReceipt> {
  const transaction = new TokenCreateTransaction()
    .setAdminKey(client.operatorPublicKey as PublicKey)
    .setTreasuryAccountId(client.operatorAccountId as AccountId)
    .setTokenName(options.name)
    .setTokenSymbol(options.symbol)
    .setDecimals(options.decimals)
    .setInitialSupply(options.initialSupply)
    .setKycKey(options.kycPublicKey)
    .setFreezeKey(options.freezePublicKey)
    .setPauseKey(options.pausePublicKey)
    .setWipeKey(options.wipePublicKey)
    .setSupplyKey(options.supplyPublicKey)
    .setFeeScheduleKey(options.feeSchedulePublicKey)
    .setFreezeDefault(options.freezeDefault)
    .setExpirationTime(options.expirationTime)
    .setAutoRenewAccountId(options.autoRenewAccountId)
    .setTokenMemo(options.tokenMemo)
    .setCustomFees(options.customFees)
    .setSupplyType(options.supplyType)
    .setMaxSupply(options.maxSupply)
    .freezeWith(client);

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
