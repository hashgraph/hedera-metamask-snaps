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

import { providerErrors } from '@metamask/rpc-errors';
import type { DialogParams } from '@metamask/snaps-sdk';
import { divider, heading, text } from '@metamask/snaps-sdk';
import { HederaClientImplFactory } from '../client/HederaClientImplFactory';
import { SignScheduledTxCommand } from '../commands/SignScheduledTxCommand';
import type { TxReceipt } from '../types/hedera';
import type { SignScheduledTxParams } from '../types/params';
import type { WalletSnapParams } from '../types/state';
import { SnapUtils } from '../utils/SnapUtils';

export class SignScheduledTxFacade {
  public static async signScheduledTx(
    walletSnapParams: WalletSnapParams,
    signScheduledTxParams: SignScheduledTxParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;
    const { scheduleId } = signScheduledTxParams;

    const { hederaAccountId, hederaEvmAddress, network } = state.currentAccount;
    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt = {} as TxReceipt;

    const hederaClientFactory = new HederaClientImplFactory(
      hederaAccountId,
      network,
      curve,
      privateKey,
    );

    const hederaClient = await hederaClientFactory.createClient();
    if (hederaClient === null) {
      throw new Error('hederaClient is null');
    }

    try {
      const panelToShow = [
        heading('Sign Scheduled Transaction'),
        text('Are you sure you want sign the following transaction?'),
        divider(),
      ];

      panelToShow.push(text(`Schedule ID : ${scheduleId}`));
      panelToShow.push(divider());

      const dialogParams: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(origin, panelToShow),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParams);
      if (!confirmed) {
        console.error(`User rejected the transaction`);
        throw providerErrors.userRejectedRequest();
      }

      const command = new SignScheduledTxCommand(scheduleId);

      txReceipt = await command.execute(hederaClient.getClient());

      console.log('txReceipt: ', JSON.stringify(txReceipt, null, 4));

      return txReceipt;
    } catch (error: any) {
      console.error(
        `Error while trying to sign scheduled transaction: ${String(error)}`,
      );
      throw new Error(error);
    }
  }
}
