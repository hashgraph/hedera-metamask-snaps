import { divider, heading, text } from '@metamask/snaps-ui';
import {
  GoogleToken,
  IdentitySnapParams,
  SnapDialogParams,
} from '../../interfaces';
import { verifyToken } from '../../plugins/veramo/google-drive-data-store';
import { generateCommonPanel, snapDialog } from '../../snap/dialog';
import { getCurrentCoinType, updateSnapState } from '../../snap/state';

export const configureGoogleAccount = async (
  identitySnapParams: IdentitySnapParams,
  { accessToken }: GoogleToken,
) => {
  const { origin, snap, state, account } = identitySnapParams;
  try {
    const newGUserEmail = await verifyToken(accessToken);
    const coinType = await getCurrentCoinType();

    const currentGUserInfo =
      state.accountState[coinType][account.evmAddress].accountConfig.identity
        .googleUserInfo;

    const dialogParams: SnapDialogParams = {
      type: 'confirmation',
      content: await generateCommonPanel(origin, [
        heading('Configure Google Drive'),
        text('Would you like to change your Google account to the following?'),
        divider(),
        text(
          `Current Gdrive account: ${
            currentGUserInfo.email ? currentGUserInfo.email : 'Not yet set'
          }`,
        ),
        text(`New Gdrive account: ${newGUserEmail}`),
      ]),
    };

    const result = await snapDialog(snap, dialogParams);
    if (result) {
      state.accountState[coinType][
        account.evmAddress
      ].accountConfig.identity.googleUserInfo.accessToken = accessToken;

      state.accountState[coinType][
        account.evmAddress
      ].accountConfig.identity.googleUserInfo.email = newGUserEmail;

      console.log('new state: ', JSON.stringify(state, null, 4));
      await updateSnapState(snap, state);
      return true;
    }
    return false;
  } catch (error) {
    console.error(
      'Could not configure Google Drive',
      JSON.stringify(error, null, 4),
    );
    throw error;
  }
};
