/*-
 *
 * Hedera Identify Snap
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
  divider,
  heading,
  panel,
  text,
} from '@metamask/snaps-sdk';
import { VerifiableCredential } from '@veramo/core';
import _ from 'lodash';
import cloneDeep from 'lodash.clonedeep';
import { getNetworkNameFromChainId } from '../constants';
import { IDataManagerQueryResult } from '../plugins/veramo/verifiable-creds-manager';

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
   * @param prompt - Prompt text of the metamask dialog box(eg. 'Are you sure you want to send VCs to the dApp?').
   * @returns Panel to be displayed in the snap dialog.
   */
  public static async generateCommonPanel(
    origin: string,
    network: string,
    prompt: any[],
  ): Promise<Panel> {
    const panelToShow = [
      text(`Origin: **${origin}**`),
      text(`Network: **${getNetworkNameFromChainId(network)}**`),
      divider(),
      ...prompt,
    ];
    return panel(panelToShow);
  }

  /**
   * Function to generate snap dialog panel for VC related functions.
   *
   * @param origin - The origin of where the call is being made from.
   * @param header - Header text of the metamask dialog box(eg. 'Retrieve Verifiable Credentials').
   * @param prompt - Prompt text of the metamask dialog box(eg. 'Are you sure you want to send VCs to the dApp?').
   * @param description - Description text of the metamask dialog box(eg. 'Some dApps are less secure than others and could save data from VCs against your will. Be careful where you send your private VCs! Number of VCs submitted is 2').
   * @param vcs - The Verifiable Credentials to show on the metamask dialog box.
   */
  public static async generateVCPanel(
    origin: string,
    network: string,
    header: string,
    prompt: string,
    description: string,
    vcs: IDataManagerQueryResult[],
  ): Promise<Panel> {
    const vcsToUse = cloneDeep(vcs);
    const panelToShow = [
      text(`Origin: ${origin}`),
      text(`Network: **${getNetworkNameFromChainId(network)}**`),
      divider(),
      heading(header),
      text(prompt),
      divider(),
      text(description),
    ];
    vcsToUse.forEach((vc, index) => {
      const vcData = vc.data as VerifiableCredential;
      delete vcData.credentialSubject.id;
      delete vcData.credentialSubject.hederaAccountId;
      panelToShow.push(divider());

      const credentialNumber = (index + 1).toString();
      panelToShow.push(text(`Credential #${credentialNumber}`));
      panelToShow.push(divider());

      panelToShow.push(text('ID: '));
      panelToShow.push(
        text(_.isEmpty(vc.metadata.id) ? credentialNumber : vc.metadata.id),
      );

      panelToShow.push(text('STORAGE: '));
      panelToShow.push(text(vc.metadata.store as string));

      panelToShow.push(text('TYPE:'));
      panelToShow.push(text(JSON.stringify(vcData.type)));

      panelToShow.push(text('SUBJECT:'));
      panelToShow.push(text(JSON.stringify(vcData.credentialSubject)));

      panelToShow.push(text('ISSUANCE DATE:'));
      const issuanceDate = new Date(
        vcData.issuanceDate as string,
      ).toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'long',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        second: '2-digit',
      });
      panelToShow.push(text(issuanceDate));

      panelToShow.push(text('EXPIRATION DATE:'));
      let expirationDate = 'Does not expire';
      if (vcData.expirationDate) {
        expirationDate = new Date(
          vcData.expirationDate as string,
        ).toLocaleString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          weekday: 'long',
          hour: '2-digit',
          hour12: false,
          minute: '2-digit',
          second: '2-digit',
        });
      }
      panelToShow.push(text(expirationDate));
    });
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
      content: await SnapUtils.generateCommonPanel(origin, network, [
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
}
