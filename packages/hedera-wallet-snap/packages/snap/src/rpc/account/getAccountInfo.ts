import { AccountId, AccountInfoQuery } from '@hashgraph/sdk';
import { divider, heading, text } from '@metamask/snaps-ui';
import _ from 'lodash';
import { HederaServiceImpl } from '../../services/impl/hedera';
import { createHederaClient } from '../../snap/account';
import { generateCommonPanel, snapDialog } from '../../snap/dialog';
import { updateSnapState } from '../../snap/state';
import { AccountInfo } from '../../types/account';
import { WalletSnapParams, SnapDialogParams } from '../../types/state';
import {
  calculateHederaQueryFees,
  deductServiceFee,
} from '../../utils/tuumService';

/**
 * Hedera Ledger Node:
 * A query that returns the current state of the account. This query does not include the
 * list of records associated with the account. Anyone on the network can request account
 * info for a given account. Queries do not change the state of the account or require
 * network consensus. The information is returned from a single node processing the query.
 *
 * Hedera Mirror Node:
 * Return the account transactions and balance information given an account alias, an account
 * id, or an evm address. The information will be limited to at most 1000 token balances for
 * the account as outlined in HIP-367. Balance information will be accurate to within 15 minutes
 * of the provided timestamp query. Historical stake and reward information is not currently
 * available so these fields contain current data. Historical ethereum nonce information is also
 * currently not available and may not be the exact value at a provided timestamp.
 *
 * @param walletSnapParams - Wallet snap params.
 * @param accountId - Hedera Account Id.
 * @returns Account Info.
 */
export async function getAccountInfo(
  walletSnapParams: WalletSnapParams,
  accountId?: string,
): Promise<AccountInfo> {
  const { origin, state, mirrorNodeUrl } = walletSnapParams;

  const { hederaAccountId, hederaEvmAddress, network } = state.currentAccount;

  let accountIdToUse = hederaAccountId;

  let accountInfo = {} as AccountInfo;

  try {
    if (accountId && !_.isEmpty(accountId)) {
      if (!AccountId.fromString(accountId)) {
        console.error(
          `Invalid Hedera Account Id '${accountId}' is not a valid account Id`,
        );
        throw new Error(
          `Invalid Hedera Account Id '${accountId}' is not a valid account Id`,
        );
      }
      accountIdToUse = accountId;
    }

    if (_.isEmpty(mirrorNodeUrl)) {
      console.log('Retrieving account info using Hedera Ledger Node');
      const hederaClient = await createHederaClient(
        state.accountState[hederaEvmAddress][network].keyStore.curve,
        state.accountState[hederaEvmAddress][network].keyStore.privateKey,
        hederaAccountId,
        network,
      );

      // Create the account info query
      const query = new AccountInfoQuery({ accountId: accountIdToUse });
      const queryCost = (
        await query.getCost(hederaClient.getClient())
      ).toBigNumber();
      const { serviceFee, estimatedCost, maxCost } =
        calculateHederaQueryFees(queryCost);

      const dialogParamsForHederaAccountId: SnapDialogParams = {
        type: 'confirmation',
        content: await generateCommonPanel(origin, [
          heading('Get account info'),
          text(
            `Note that since you didn't pass 'mirrorNodeUrl' parameter, the snap will query the Hedera Ledger node to retrieve the account information and this has the following costs associated with the query.`,
          ),
          divider(),
          text(`Estimated Query Fee: ${estimatedCost.toFixed(8)} Hbar`),
          text(`Max Query Fee: ${maxCost.toFixed(8)} Hbar`),
          divider(),
        ]),
      };
      const confirmed = await snapDialog(dialogParamsForHederaAccountId);
      if (!confirmed) {
        console.error(`User rejected the transaction`);
        throw new Error(`User rejected the transaction`);
      }

      hederaClient.setMaxQueryPayment(maxCost.toFixed(8));

      accountInfo = await hederaClient.getAccountInfo(accountIdToUse);

      // Service Fee to Tuum Tech's account
      await deductServiceFee(
        state.accountState[hederaEvmAddress][network].accountInfo.balance,
        serviceFee,
        hederaClient,
      );
    } else {
      console.log('Retrieving account info using Hedera Mirror node');
      const hederaService = new HederaServiceImpl(network, mirrorNodeUrl);
      accountInfo = await hederaService.getMirrorAccountInfo(accountIdToUse);
    }

    // Only change the state if we are retrieving account Id of the currently logged in user
    // Only change the values for which is necessary
    if (_.isEmpty(accountId)) {
      accountInfo.alias =
        state.accountState[hederaEvmAddress][network].accountInfo.alias;
      accountInfo.createdTime =
        state.accountState[hederaEvmAddress][network].accountInfo.createdTime;
      accountInfo.key.type =
        state.accountState[hederaEvmAddress][network].accountInfo.key.type;
      accountInfo.balance.tokens =
        state.accountState[hederaEvmAddress][
          network
        ].accountInfo.balance.tokens;

      state.accountState[hederaEvmAddress][network].accountInfo.balance.hbars =
        accountInfo.balance.hbars;
      state.accountState[hederaEvmAddress][
        network
      ].accountInfo.balance.timestamp = accountInfo.balance.timestamp;
      state.accountState[hederaEvmAddress][network].accountInfo.expirationTime =
        accountInfo.expirationTime;
      state.accountState[hederaEvmAddress][
        network
      ].accountInfo.autoRenewPeriod = accountInfo.autoRenewPeriod;
      state.accountState[hederaEvmAddress][network].accountInfo.ethereumNonce =
        accountInfo.ethereumNonce;
      state.accountState[hederaEvmAddress][network].accountInfo.isDeleted =
        accountInfo.isDeleted;
      state.accountState[hederaEvmAddress][network].accountInfo.stakingInfo =
        accountInfo.stakingInfo;
      await updateSnapState(state);
    }
  } catch (error: any) {
    console.error(`Error while trying to get account info: ${String(error)}`);
    throw new Error(`Error while trying to get account info: ${String(error)}`);
  }

  return accountInfo;
}
