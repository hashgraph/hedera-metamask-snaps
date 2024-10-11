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
