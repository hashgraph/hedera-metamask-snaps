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
