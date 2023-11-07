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
  AccountBalanceQuery,
  AccountId,
  HbarUnit,
  type Client,
} from '@hashgraph/sdk';

/**
 * Retrieve the account balance.
 *
 * @param client - Hedera client.
 */
export async function getAccountBalance(client: Client): Promise<number> {
  // Create the account balance query
  const query = new AccountBalanceQuery().setAccountId(
    client.operatorAccountId as AccountId,
  );

  // Submit the query to a Hedera network
  const accountBalance = await query.execute(client);

  const amount = accountBalance.hbars.to(HbarUnit.Hbar);
  return amount.toNumber();
}
