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

import type { DialogParams, Panel } from '@metamask/snaps-sdk';
import { divider, heading, panel, text } from '@metamask/snaps-sdk';
import {
  FEE_DIGIT_LENGTH,
  FEE_DISPLAY_REGEX,
  HBAR_ASSET_STRING,
} from '../types/constants';
import type { AtomicSwap, SimpleTransfer } from '../types/hedera';
import { AssetType } from '../types/hedera';

export class SnapUtils {
  /**
   * Function to generate snap dialog panel.
   * @param origin - The origin of where the call is being made from.
   * @param prompt - Prompt text of the metamask dialog box(eg. 'Are you sure you want to send VCs to the dApp?').
   * @returns Panel to be displayed in the snap dialog.
   */
  public static async generateCommonPanel(
    origin: string,
    prompt: any[],
  ): Promise<Panel> {
    const panelToShow = [text(`Origin: ${origin}`), divider(), ...prompt];
    return panel(panelToShow);
  }

  /**
   * Request Hedera Account Id.
   * @param origin - Source.
   * @param publicKey - Public key.
   * @param address - EVM address.
   * @returns Hedera account id.
   */
  public static async requestHederaAccountId(
    origin: string,
    publicKey: string,
    address: string,
  ): Promise<string> {
    const dialogParamsForHederaAccountId: DialogParams = {
      type: 'prompt',
      content: await SnapUtils.generateCommonPanel(origin, [
        heading('Connect to Hedera Account'),
        text(
          `Enter your hedera account Id associated with the following account`,
        ),
        divider(),
        text(`Public Key: ${publicKey}`),
        text(`EVM Address: ${address}`),
        divider(),
      ]),
      placeholder: '0.0.3658062',
    };
    return (await SnapUtils.snapDialog(
      dialogParamsForHederaAccountId,
    )) as string;
  }

  /**
   * Function that opens snap dialog.
   * @param params - Snap dialog params.
   * @returns Response from the snap dialog.
   */
  public static async snapDialog(
    params: DialogParams,
  ): Promise<string | boolean | null> {
    return (await snap.request({
      method: 'snap_dialog',
      params,
    })) as boolean;
  }

  public static formatFeeDisplay(
    feeToDisplay: number,
    transfer: SimpleTransfer,
  ) {
    return text(
      `Service Fee: ${feeToDisplay
        .toFixed(FEE_DIGIT_LENGTH)
        .replace(FEE_DISPLAY_REGEX, '$1')} ${
        transfer.assetType === HBAR_ASSET_STRING
          ? HBAR_ASSET_STRING
          : (transfer.assetId as string)
      }`,
    );
  }

  public static formatSwapFeeDisplay(feeToDisplay: number, swap: AtomicSwap) {
    return text(
      `Service Fee: ${feeToDisplay
        .toFixed(FEE_DIGIT_LENGTH)
        .replace(FEE_DISPLAY_REGEX, '$1')} ${
        swap.sender.assetType === AssetType.HBAR
          ? HBAR_ASSET_STRING
          : (swap.sender.assetId as string)
      }`,
    );
  }
}
