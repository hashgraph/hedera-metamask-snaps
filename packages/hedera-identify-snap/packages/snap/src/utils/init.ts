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

import { SnapsGlobalObject } from '@metamask/snaps-types';
import { heading, text } from '@metamask/snaps-ui';
import { IdentitySnapState, SnapDialogParams } from '../interfaces';
import { generateCommonPanel, snapDialog } from '../snap/dialog';
import { initSnapState } from '../snap/state';

/**
 * Init snap state.
 *
 * @param snap - Snap.
 */
export async function init(
  snap: SnapsGlobalObject,
): Promise<IdentitySnapState> {
  const dialogParams: SnapDialogParams = {
    type: 'alert',
    content: await generateCommonPanel(origin, [
      heading('Risks about using Identify Snap'),
      text(
        'Applications do NOT have access to your private keys. You are in control of what VCs and VPs you sign and what you use your DIDs for.',
      ),
    ]),
  };

  await snapDialog(snap, dialogParams);
  console.log('starting init');
  return await initSnapState(snap);
}
