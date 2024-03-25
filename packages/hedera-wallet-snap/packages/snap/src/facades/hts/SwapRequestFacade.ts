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
import { SwapRequestCommand } from '../../commands/hts/SwapRequestCommand';
import type { AtomicSwapRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';
import type { TransferTransaction } from '@hashgraph/sdk';
import { PrivateKey } from '@hashgraph/sdk';
import { HederaUtils } from '../../utils/HederaUtils';

export class SwapRequestFacade {
  /**
   * Wipes the provided amount of fungible or non-fungible tokens from the specified
   * Hedera account. This transaction does not delete tokens from the treasury account.
   * This transaction must be signed by the token's Wipe Key. Wiping an account's tokens
   * burns the tokens and decreases the total supply.
   * @param walletSnapParams - Wallet snap params.
   * @param swapRequestParams - Parameters for wiping a token.
   * @returns Receipt of the transaction.
   */
  public static async createSwapRequest(
    walletSnapParams: WalletSnapParams,
    swapRequestParams: AtomicSwapRequestParams,
  ): Promise<TransferTransaction> {
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
        heading('Create Atomic Swap Request'),
        text('Are you sure you want to create the following request?'),
        divider(),
      ];

      panelToShow.push(
        text(`1st Party Account Id : ${swapRequestParams.sourceAccountId}`),
      );

      panelToShow.push(
        text(
          `2nd Party Account Id : ${swapRequestParams.destinationAccountId}`,
        ),
      );

      if (swapRequestParams.sourceHbarAmount) {
        panelToShow.push(
          text(`1st Party Hbar Amount : ${swapRequestParams.sourceHbarAmount}`),
        );
      }

      if (swapRequestParams.destinationHbarAmount) {
        panelToShow.push(
          text(
            `2nd Party Hbar Amount: ${swapRequestParams.destinationHbarAmount}`,
          ),
        );
      }

      if (
        swapRequestParams.sourceTokenId &&
        swapRequestParams.sourceTokenAmount
      ) {
        panelToShow.push(
          text(`1st Party Token Id: ${swapRequestParams.sourceTokenId}`),
          text(
            `1st Party Token Amount: ${swapRequestParams.sourceTokenAmount}`,
          ),
        );
      }

      if (
        swapRequestParams.destinationTokenId &&
        swapRequestParams.destinationTokenAmount
      ) {
        panelToShow.push(
          text(`2nd Party Token Id: ${swapRequestParams.destinationTokenId}`),
          text(
            `2nd Party Token Amount: ${swapRequestParams.destinationTokenAmount}`,
          ),
        );
      }

      const dialogParams: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(origin, panelToShow),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParams);
      if (!confirmed) {
        console.error(`User rejected the transaction`);
        throw providerErrors.userRejectedRequest();
      }

      const privateKeyObj = PrivateKey.fromStringECDSA(privateKey);

      const command = new SwapRequestCommand(swapRequestParams, privateKeyObj);

      return await command.execute(hederaClient.getClient());
    } catch (error: any) {
      console.error(
        `Error while trying to perform atomic swap: ${String(error)}`,
      );
      throw new Error(error);
    }
  }
}
