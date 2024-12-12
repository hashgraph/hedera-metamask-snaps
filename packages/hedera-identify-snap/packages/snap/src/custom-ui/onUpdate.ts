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

import type { OnUpdateHandler } from '@metamask/snaps-sdk';

import { heading, panel, text } from '@metamask/snaps-sdk';

export const onUpdateUI: OnUpdateHandler = async () => {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: panel([
        heading('Thank you for updating Identify Snap'),
        text('New features added in this version:'),
        text('🚀 Added support for did:key method'),
        text('🚀 Added support for did:hedera method'),
        text('🚀 Added snap home page'),
        text('🚀 Updated some dialog boxes'),
        text(
          '🚀 Send notifications for certain API calls whenever snap errors out',
        ),
      ]),
    },
  });
};
