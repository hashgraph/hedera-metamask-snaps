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
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import type { AtomicSwapAcknowledgeParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';
import { HederaUtils } from '../../utils/HederaUtils';
import type { TxReceipt } from '../../types/hedera';
import { SwapAcknowledgeCommand } from '../../commands/hts/SwapAcknowledgeCommand';

export class SwapAcknowledgeFacade {
  /**
   * Wipes the provided amount of fungible or non-fungible tokens from the specified
   * Hedera account. This transaction does not delete tokens from the treasury account.
   * This transaction must be signed by the token's Wipe Key. Wiping an account's tokens
   * burns the tokens and decreases the total supply.
   * @param walletSnapParams - Wallet snap params.
   * @param swapAcknowledgeParams - Acknowledgement params.
   * @returns Receipt of the transaction.
   */
  public static async acknowledgeSwapRequest(
    walletSnapParams: WalletSnapParams,
    swapAcknowledgeParams: AtomicSwapAcknowledgeParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { hederaAccountId, hederaEvmAddress, network, mirrorNodeUrl } =
      state.currentAccount;
    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

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
      await HederaUtils.getMirrorAccountInfo(hederaAccountId, mirrorNodeUrl);

      const panelToShow = [
        heading('Acknowledge Atomic Swap Request'),
        text('Are you sure you want to acknowledge the following request?'),
        divider(),
      ];

      panelToShow.push(
        text(`Scheduled Entity Id : ${swapAcknowledgeParams.scheduleId}`),
      );

      const dialogParams: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(origin, panelToShow),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParams);
      if (!confirmed) {
        console.error(`User rejected the transaction`);
        throw providerErrors.userRejectedRequest();
      }

      const privateKeyObj = hederaClient.getPrivateKey();
      if (privateKeyObj === null) {
        throw new Error('client private key was null');
      }

      const command = new SwapAcknowledgeCommand(
        privateKeyObj,
        swapAcknowledgeParams.scheduleId,
      );

      return await command.execute(hederaClient.getClient());
    } catch (error: any) {
      console.error(
        `Error while trying to perform atomic swap: ${String(error)}`,
      );
      throw new Error(error);
    }
  }
}
