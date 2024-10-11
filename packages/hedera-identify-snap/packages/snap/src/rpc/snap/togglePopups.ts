import { heading, text } from '@metamask/snaps-ui';
import { IdentitySnapParams, SnapDialogParams } from '../../interfaces';
import {
  generateCommonPanel,
  snapDialog,
  updatePopups,
} from '../../snap/dialog';

/**
 * Function to toggle popups.
 *
 * @param identitySnapParams - Identity snap params.
 */
export async function togglePopups(
  identitySnapParams: IdentitySnapParams,
): Promise<boolean> {
  const { origin, snap, state } = identitySnapParams;
  const { disablePopups } = state.snapConfig.dApp;

  const toggleTextToShow = disablePopups ? 'enable' : 'disable';
  const dialogParams: SnapDialogParams = {
    type: 'confirmation',
    content: await generateCommonPanel(origin, [
      heading('Toggle Popups'),
      text(`Would you like to ${toggleTextToShow} the popups?`),
    ]),
  };
  const result = await snapDialog(snap, dialogParams);
  if (result) {
    await updatePopups(snap, state);
    return true;
  }
  return false;
}
