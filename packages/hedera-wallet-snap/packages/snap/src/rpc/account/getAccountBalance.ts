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

import { createHederaClient } from '../../snap/account';
import { updateSnapState } from '../../snap/state';
import { WalletSnapParams } from '../../types/state';

/**
 * A query that returns the account balance for the specified account.
 * Requesting an account balance is currently free of charge. Queries do
 * not change the state of the account or require network consensus. The
 * information is returned from a single node processing the query.
 *
 * @param walletSnapParams - Wallet snap params.
 * @returns Account Balance.
 */
export async function getAccountBalance(
  walletSnapParams: WalletSnapParams,
): Promise<number> {
  const { state } = walletSnapParams;

  const { hederaAccountId, hederaEvmAddress, network } = state.currentAccount;

  try {
    const hederaClient = await createHederaClient(
      state.accountState[hederaEvmAddress][network].keyStore.curve,
      state.accountState[hederaEvmAddress][network].keyStore.privateKey,
      hederaAccountId,
      network,
    );

    const hbarBalance = await hederaClient.getAccountBalance();
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

    await updateSnapState(state);
  } catch (error: any) {
    console.error(
      `Error while trying to get account balance: ${String(error)}`,
    );
    throw new Error(
      `Error while trying to get account balance: ${String(error)}`,
    );
  }

  return state.accountState[hederaEvmAddress][network].accountInfo.balance
    .hbars;
}
