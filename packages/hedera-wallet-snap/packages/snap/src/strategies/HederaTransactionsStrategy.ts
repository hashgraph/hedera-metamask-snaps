/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

import { rpcErrors } from '@metamask/rpc-errors';
import type { MirrorTransactionInfo } from '../types/hedera';
import type { GetTransactionsRequestParams } from '../types/params';
import type { WalletSnapParams } from '../types/state';
import { HederaUtils } from '../utils/HederaUtils';

export class HederaTransactionsStrategy {
  public static async getTransactions(
    walletSnapParams: WalletSnapParams,
    getTransactionsParams: GetTransactionsRequestParams,
  ): Promise<MirrorTransactionInfo[]> {
    const { state } = walletSnapParams;

    const { transactionId = '' } = getTransactionsParams;

    const { hederaAccountId, mirrorNodeUrl } = state.currentAccount;

    let transactionsHistory = {} as MirrorTransactionInfo[];

    try {
      console.log('Retrieving transaction history using Hedera Mirror node');
      transactionsHistory = await HederaUtils.getMirrorTransactions(
        hederaAccountId,
        transactionId,
        mirrorNodeUrl,
      );
    } catch (error: any) {
      const errMessage = `Error while trying to get transaction history`;
      console.error(errMessage, String(error));
      throw rpcErrors.resourceUnavailable(errMessage);
    }

    return transactionsHistory;
  }
}
