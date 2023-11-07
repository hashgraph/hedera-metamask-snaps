/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2023 Tuum Tech
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

import { heading, text } from '@metamask/snaps-ui';

import { generateCommonPanel, snapDialog } from '../snap/dialog';
import { initSnapState } from '../snap/state';
import { SnapDialogParams, WalletSnapState } from '../types/state';

/**
 * Init snap state.
 *
 * @param origin - Source.
 */
export async function init(origin: string): Promise<WalletSnapState> {
  const dialogParams: SnapDialogParams = {
    type: 'alert',
    content: await generateCommonPanel(origin, [
      heading('Risks about using Hedera Wallet'),
      text(
        'Applications do NOT have access to your private keys. Everything is stored inside the sandbox environment of Hedera Wallet inside Metamask',
      ),
    ]),
  };

  await snapDialog(dialogParams);
  console.log('starting init');
  return await initSnapState();
}
