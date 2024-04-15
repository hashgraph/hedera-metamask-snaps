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
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { SnapState } from '../../snap/SnapState';
import type { WalletSnapParams } from '../../types/state';

export class GetAccountBalanceFacade {
  public static async getAccountBalance(
    walletSnapParams: WalletSnapParams,
  ): Promise<number> {
    const { state } = walletSnapParams;

    const { hederaAccountId, hederaEvmAddress, network } = state.currentAccount;

    let hbarBalance = 0;
    try {
      const hederaClientImplFactory = new HederaClientImplFactory(
        state.accountState[hederaEvmAddress][network].keyStore.curve,
        state.accountState[hederaEvmAddress][network].keyStore.privateKey,
        hederaAccountId,
        network,
      );
      const hederaClient = await hederaClientImplFactory.createClient();

      if (hederaClient === null) {
        throw rpcErrors.resourceUnavailable('hedera client returned null');
      }
      hbarBalance = await hederaClient.getAccountBalance();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.accountState[hederaEvmAddress][network].accountInfo.balance.hbars =
        hbarBalance;
      state.currentAccount.balance.hbars = hbarBalance;

      const currentTimestamp = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.accountState[hederaEvmAddress][
        network
      ].accountInfo.balance.timestamp = currentTimestamp;
      state.currentAccount.balance.timestamp = currentTimestamp;

      await SnapState.updateState(state);
    } catch (error: any) {
      const errMessage = 'Error while trying to get account balance';
      console.error(errMessage, String(error));
      throw rpcErrors.transactionRejected(errMessage);
    }

    return hbarBalance;
  }
}
