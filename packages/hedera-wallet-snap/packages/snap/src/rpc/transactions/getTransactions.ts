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

import { providerErrors } from '@metamask/rpc-errors';
import { HederaServiceImpl } from '../../services/impl/hedera';
import { MirrorTransactionInfo } from '../../types/hedera';
import { GetTransactionsRequestParams } from '../../types/params';
import { WalletSnapParams } from '../../types/state';

/**
 * The transaction object represents the transactions processed on the Hedera network.
 * You can retrieve this to view the transaction metadata information including transaction
 * id, timestamp, transaction fee, transfer list, etc. If a transaction was submitted to
 * multiple nodes, the successful transaction and duplicate transaction(s) will be
 * returned as separate entries in the response with the same transaction ID.
 *
 * @param walletSnapParams - Wallet snap params.
 * @param getTransactionsParams - Parameters for getting transactions.
 * @returns Transactions History.
 */
export async function getTransactions(
  walletSnapParams: WalletSnapParams,
  getTransactionsParams: GetTransactionsRequestParams,
): Promise<MirrorTransactionInfo[]> {
  const { state } = walletSnapParams;

  const { transactionId = '' } = getTransactionsParams;

  const { hederaAccountId, network, mirrorNodeUrl } = state.currentAccount;

  let transactionsHistory = {} as MirrorTransactionInfo[];

  try {
    console.log('Retrieving transaction history using Hedera Mirror node');
    const hederaService = new HederaServiceImpl(network, mirrorNodeUrl);
    transactionsHistory = await hederaService.getMirrorTransactions(
      hederaAccountId,
      transactionId,
    );
  } catch (error: any) {
    const errMessage = `Error while trying to get transaction history: ${String(
      error,
    )}`;
    console.error(errMessage);
    throw providerErrors.unsupportedMethod(errMessage);
  }

  return transactionsHistory;
}
