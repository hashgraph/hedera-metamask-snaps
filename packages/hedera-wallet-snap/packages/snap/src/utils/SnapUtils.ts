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

import type { DialogParams, NodeType, Panel } from '@metamask/snaps-sdk';
import {
  NotificationType,
  copyable,
  divider,
  heading,
  panel,
  text,
} from '@metamask/snaps-sdk';
import {
  FEE_DIGIT_LENGTH,
  FEE_DISPLAY_REGEX,
  HBAR_ASSET_STRING,
} from '../types/constants';
import type { SimpleTransfer, TxRecord } from '../types/hedera';

export class SnapUtils {
  /**
   * Function to generate panel.
   * @returns Panel to be displayed in the snap dialog.
   */
  public static initializePanelToShow(): any {
    const panelToShow: (
      | {
          value: string;
          type: NodeType.Heading;
        }
      | {
          value: string;
          type: NodeType.Text;
          markdown?: boolean | undefined;
        }
      | {
          type: NodeType.Divider;
        }
      | {
          value: string;
          type: NodeType.Copyable;
          sensitive?: boolean | undefined;
        }
    )[] = [];
    return panelToShow;
  }

  /**
   * Function to generate snap dialog panel.
   * @param origin - The origin of where the call is being made from.
   * @param network - The network the call is being made on.
   * @param mirrorNodeUrl - The mirror node url.
   * @param prompt - Prompt text of the metamask dialog box(eg. 'Are you sure you want to send VCs to the dApp?').
   * @returns Panel to be displayed in the snap dialog.
   */
  public static async generateCommonPanel(
    origin: string,
    network: string,
    mirrorNodeUrl: string,
    prompt: any[],
  ): Promise<Panel> {
    const panelToShow = [
      text(`Origin: **${origin}**`),
      text(`Network: **${network}**`),
      text(`Mirror Node: **${mirrorNodeUrl}**`),
      divider(),
      ...prompt,
    ];
    return panel(panelToShow);
  }

  /**
   * Request Hedera Account Id.
   * @param origin - Source.
   * @param network - The network the call is being made on.
   * @param mirrorNodeUrl - The mirror node url.
   * @param publicKey - Public key.
   * @param address - EVM address.
   * @returns Hedera account id.
   */
  public static async requestHederaAccountId(
    origin: string,
    network: string,
    mirrorNodeUrl: string,
    publicKey: string,
    address: string,
  ): Promise<string> {
    const dialogParamsForHederaAccountId: DialogParams = {
      type: 'prompt',
      content: await SnapUtils.generateCommonPanel(
        origin,
        network,
        mirrorNodeUrl,
        [
          heading('Connect to Hedera Account'),
          text(
            `Enter your hedera account Id associated with the following account`,
          ),
          divider(),
          text(`Public Key: ${publicKey}`),
          text(`EVM Address: ${address}`),
          divider(),
        ],
      ),
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

  public static async snapCreateInteractiveUI(
    panelToShow: Panel,
  ): Promise<{ interfaceId: string; confirmed: boolean }> {
    const interfaceId = await snap.request({
      method: 'snap_createInterface',
      params: {
        ui: panelToShow,
      },
    });
    return {
      interfaceId,
      confirmed: (await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          id: interfaceId,
        },
      })) as boolean,
    };
  }

  public static async snapUpdateInteractiveUI(
    interfaceId: string,
    panelToShow: Panel,
  ) {
    await snap.request({
      method: 'snap_updateInterface',
      params: {
        id: interfaceId,
        ui: panelToShow,
      },
    });
  }

  public static async snapCreateDialogAfterTransaction(
    network: string,
    result: TxRecord,
  ): Promise<any> {
    const panelToShow = SnapUtils.initializePanelToShow();
    if (result.receipt.status === 'SUCCESS') {
      panelToShow.push(
        heading('Transaction successful'),
        text(`**Transaction ID**:`),
        copyable(result.transactionId),
        text(
          `View on [Hashscan](https://hashscan.io/${network}/transaction/${result.transactionId})`,
        ),
        text(`**Transaction Hash**:`),
        copyable(result.transactionHash),
        text(`**Transaction Fee**: ${result.transactionFee}`),
        text(`**Transaction Time**: ${result.consensusTimestamp}`),
      );
      panelToShow.push(divider());
      panelToShow.push(heading('Transfers:'));
      for (const transfer of result.transfers) {
        panelToShow.push(
          text(
            `**Transferred** ${transfer.amount} HBAR to ${transfer.accountId}`,
          ),
        );
      }
    } else {
      panelToShow.push(
        heading('Transaction failed'),
        text(`**Transaction ID**:`),
        copyable(result.transactionId),
      );
    }
    await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'alert',
        content: panel(panelToShow),
      },
    });
  }

  /**
   * Function that sends notification to Metamask.
   * @param content - Content to write.
   */
  public static async snapNotification(content: string): Promise<void> {
    await snap.request({
      method: 'snap_notify',
      params: {
        type: NotificationType.InApp,
        message: content,
      },
    });
    await snap.request({
      method: 'snap_notify',
      params: {
        type: NotificationType.Native,
        message: content,
      },
    });
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
}
