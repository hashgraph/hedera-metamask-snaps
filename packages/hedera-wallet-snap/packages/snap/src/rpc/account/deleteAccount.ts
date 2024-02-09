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
import { heading, text } from '@metamask/snaps-ui';
import { AccountBalance, TxReceipt } from '../../types/hedera';
import { createHederaClient } from '../../snap/account';
import { generateCommonPanel, snapDialog } from '../../snap/dialog';
import { updateSnapState } from '../../snap/state';
import { Account, AccountInfo } from '../../types/account';
import { DeleteAccountRequestParams } from '../../types/params';
import { SnapDialogParams, WalletSnapParams } from '../../types/state';

/**
 * Delete an account.
 *
 * Before deleting an account, the existing HBAR must be transferred to another account.
 * Submitting a transaction to delete an account without assigning a beneficiary via
 * setTransferAccountId() will result in a ACCOUNT_ID_DOES_NOT_EXIST error. Transfers
 * cannot be made into a deleted account. A record of the deleted account will remain
 * in the ledger until it expires. The expiration of a deleted account can be extended.
 * The account that is being deleted is required to sign the transaction.
 *
 * @param walletSnapParams - Wallet snap params.
 * @param deleteAccountRequestParams - Parameters for deleting an account.
 * @returns Receipt of the transaction.
 */
export async function deleteAccount(
  walletSnapParams: WalletSnapParams,
  deleteAccountRequestParams: DeleteAccountRequestParams,
): Promise<TxReceipt> {
  const { origin, state } = walletSnapParams;

  const { transferAccountId } = deleteAccountRequestParams;

  const { hederaEvmAddress, hederaAccountId, network } = state.currentAccount;

  const { privateKey, curve } =
    state.accountState[hederaEvmAddress][network].keyStore;

  let txReceipt = {} as TxReceipt;
  try {
    const panelToShow = [
      heading('Delete Account'),
      text('Are you sure you want to delete your account?'),
      text(
        `All your HBAR will be transferred to ${transferAccountId} and your account will be deleted.`,
      ),
      text(`NOTE: This action is irreversible.`),
    ];
    const dialogParamsForDeleteAccount: SnapDialogParams = {
      type: 'confirmation',
      content: await generateCommonPanel(origin, panelToShow),
    };
    const confirmed = await snapDialog(dialogParamsForDeleteAccount);
    if (!confirmed) {
      console.error(`User rejected the transaction`);
      throw providerErrors.userRejectedRequest();
    }

    const hederaClient = await createHederaClient(
      curve,
      privateKey,
      hederaAccountId,
      network,
    );
    txReceipt = await hederaClient.deleteAccount({ transferAccountId });

    // eslint-disable-next-line require-atomic-updates
    state.currentAccount = {
      ...state.currentAccount,
      hederaAccountId: '',
      balance: {} as AccountBalance,
    } as Account;
    // eslint-disable-next-line require-atomic-updates
    state.accountState[hederaEvmAddress][network].keyStore = {
      ...state.accountState[hederaEvmAddress][network].keyStore,
      hederaAccountId: '',
    };
    // eslint-disable-next-line require-atomic-updates
    state.accountState[hederaEvmAddress][network].accountInfo =
      {} as AccountInfo;
    await updateSnapState(state);
  } catch (error: any) {
    const errMessage = `Error while trying to delete account: ${String(error)}`;
    console.error(errMessage);
    throw providerErrors.unsupportedMethod(errMessage);
  }

  return txReceipt;
}
