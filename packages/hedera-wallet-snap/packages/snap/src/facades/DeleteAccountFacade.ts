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

import type { WalletSnapParams } from '../types/state';
import type { DeleteAccountRequestParams } from '../types/params';
import type { TxReceipt, AccountBalance } from '../types/hedera';
import { DialogParams, heading, text } from '@metamask/snaps-sdk';
import { SnapUtils } from '../utils/SnapUtils';
import { providerErrors } from '@metamask/rpc-errors';

import type { AccountInfo, Account } from '../types/account';
import { SnapState } from '../snap/SnapState';
import { HederaClientImplFactory } from '../client/HederaClientImplFactory';
import { DeleteAccountCommand } from '../commands/DeleteAccountCommand';

export class DeleteAccountFacade {
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
  public static async deleteAccount(
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
      const dialogParamsForDeleteAccount: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(origin, panelToShow),
      };
      const confirmed = await SnapUtils.snapDialog(
        dialogParamsForDeleteAccount,
      );
      if (!confirmed) {
        console.error(`User rejected the transaction`);
        throw providerErrors.userRejectedRequest();
      }

      const hederaClientFactory = new HederaClientImplFactory(
        hederaAccountId,
        network,
        curve,
        privateKey,
      );

      const hederaClient = await hederaClientFactory.createClient();
      if (hederaClient === null) {
        throw new Error('hedera client returned null');
      }
      const command = new DeleteAccountCommand(transferAccountId);
      txReceipt = await command.execute(hederaClient.getClient());

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
      await SnapState.updateState(state);
    } catch (error: any) {
      const errMessage = `Error while trying to delete account: ${String(
        error,
      )}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return txReceipt;
  }
}
