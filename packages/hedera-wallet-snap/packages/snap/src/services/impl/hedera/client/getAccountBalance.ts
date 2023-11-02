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
