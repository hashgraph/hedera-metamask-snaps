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

import { rpcErrors } from '@metamask/rpc-errors';
import type { MirrorTopicMessage } from '../../types/hedera';
import type { GetTopicMessagesRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { HederaUtils } from '../../utils/HederaUtils';
import { SnapUtils } from '../../utils/SnapUtils';

export class GetTopicMessagesFacade {
  public static async getTopicMessages(
    walletSnapParams: WalletSnapParams,
    getTopicMessagesParams: GetTopicMessagesRequestParams,
  ): Promise<MirrorTopicMessage[]> {
    const { state } = walletSnapParams;

    const { topicId, sequenceNumber } = getTopicMessagesParams;

    const { mirrorNodeUrl } = state.currentAccount;

    let topicMessages: MirrorTopicMessage[] = [];

    try {
      topicMessages = await HederaUtils.getMirrorTopicMessages(
        mirrorNodeUrl,
        topicId,
        sequenceNumber,
      );
    } catch (error: any) {
      const errMessage = 'Error while trying to get topic messages';
      console.error('Error occurred: %s', errMessage, String(error));
      await SnapUtils.snapNotification(
        `Error occurred: ${errMessage} - ${String(error)}`,
      );
      throw rpcErrors.transactionRejected(errMessage);
    }

    return topicMessages;
  }
}
