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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    state.accountState[hederaEvmAddress][network].accountInfo.balance.hbars =
      await hederaClient.getAccountBalance();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    state.accountState[hederaEvmAddress][
      network
    ].accountInfo.balance.timestamp = new Date().toISOString();
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
