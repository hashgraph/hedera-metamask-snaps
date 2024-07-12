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

import { TopicInfoQuery } from '@hashgraph/sdk';
import { rpcErrors } from '@metamask/rpc-errors';
import type { DialogParams, NodeType } from '@metamask/snaps-sdk';
import { divider, heading, text } from '@metamask/snaps-sdk';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import type { TopicInfo } from '../../types/consensus';
import type { GetTopicInfoRequestParams, ServiceFee } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { FeeUtils } from '../../utils/FeeUtils';
import { SnapUtils } from '../../utils/SnapUtils';

export class GetTopicInfoFacade {
  public static async getTopicInfo(
    walletSnapParams: WalletSnapParams,
    getTopicInfoRequestParams: GetTopicInfoRequestParams,
  ): Promise<TopicInfo> {
    const { origin, state } = walletSnapParams;

    const {
      topicId,
      serviceFee = {
        percentageCut: 0,
        toAddress: '0.0.98', // Hedera Fee collection account
      } as ServiceFee,
    } = getTopicInfoRequestParams;

    const { hederaAccountId, hederaEvmAddress, network, mirrorNodeUrl } =
      state.currentAccount;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let topicInfo = {} as TopicInfo;

    try {
      const hederaClientFactory = new HederaClientImplFactory(
        hederaAccountId,
        network,
        curve,
        privateKey,
      );
      const hederaClient = await hederaClientFactory.createClient();

      // Create the topic info query
      const query = new TopicInfoQuery({ topicId });
      if (hederaClient === null) {
        throw rpcErrors.resourceUnavailable('hedera client returned null');
      }
      const queryCost = (
        await query.getCost(hederaClient.getClient())
      ).toBigNumber();

      const { serviceFeeToPay, maxCost } = FeeUtils.calculateHederaQueryFees(
        queryCost,
        serviceFee.percentageCut,
      );

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

      panelToShow.push(
        heading('Get topic info'),
        text(
          `Estimated Query Fee: ${queryCost
            .toFixed(8)
            .replace(/(\.\d*?[1-9])0+$|\.0*$/u, '$1')} Hbar`,
        ),
      );

      if (serviceFee.percentageCut > 0) {
        panelToShow.push(
          text(
            `Service Fee: ${serviceFeeToPay
              .toFixed(8)
              .replace(/(\.\d*?[1-9])0+$|\.0*$/u, '$1')} Hbar`,
          ),
        );
      }
      panelToShow.push(
        ...[
          text(
            `Estimated Max Query Fee: ${maxCost
              .toFixed(8)
              .replace(/(\.\d*?[1-9])0+$|\.0*$/u, '$1')} Hbar`,
          ),
          divider(),
        ],
      );

      const dialogParamsForHederaAccountId: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(
          origin,
          network,
          mirrorNodeUrl,
          panelToShow,
        ),
      };
      const confirmed = await SnapUtils.snapDialog(
        dialogParamsForHederaAccountId,
      );
      if (!confirmed) {
        const errMessage = 'User rejected the transaction';
        console.error(errMessage);
        throw rpcErrors.transactionRejected(errMessage);
      }

      topicInfo = await hederaClient.getTopicInfo(topicId);

      // Deduct service Fee if set
      if (serviceFee.percentageCut > 0) {
        await FeeUtils.deductServiceFee(
          serviceFeeToPay,
          serviceFee.toAddress as string,
          hederaClient,
        );
      }
    } catch (error: any) {
      const errMessage = 'Error while trying to get topic info';
      console.error('Error occurred: %s', errMessage, String(error));
      await SnapUtils.snapNotification(
        `Error occurred: ${errMessage} - ${String(error)}`,
      );
      throw rpcErrors.transactionRejected(errMessage);
    }

    return topicInfo;
  }
}
