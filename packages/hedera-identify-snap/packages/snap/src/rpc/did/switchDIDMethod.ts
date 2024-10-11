import { divider, heading, text } from '@metamask/snaps-ui';
import { IdentitySnapParams, SnapDialogParams } from '../../interfaces';
import { generateCommonPanel, snapDialog } from '../../snap/dialog';
import { getAccountStateByCoinType, updateSnapState } from '../../snap/state';
import { availableMethods, isValidMethod } from '../../types/constants';

/**
 * Function to switch method.
 *
 * @param identitySnapParams - Identity snap params.
 * @param didMethod - DID method.
 */
export async function switchDIDMethod(
  identitySnapParams: IdentitySnapParams,
  didMethod: string,
): Promise<boolean> {
  const { snap, state, account } = identitySnapParams;

  const accountState = await getAccountStateByCoinType(
    state,
    account.evmAddress,
  );
  const method = accountState.accountConfig.identity.didMethod;
  if (!isValidMethod(didMethod)) {
    console.error(
      `did method '${didMethod}' not supported. Supported methods are: ${availableMethods}`,
    );
    throw new Error(
      `did method ${didMethod}'not supported. Supported methods are: ${availableMethods}`,
    );
  }

  if (method !== didMethod) {
    const dialogParams: SnapDialogParams = {
      type: 'confirmation',
      content: await generateCommonPanel(origin, [
        heading('Switch to a different DID method to use'),
        text('Would you like to change did method to the following?'),
        divider(),
        text(`Current DID method: ${method}\nNew DID method: ${didMethod}`),
      ]),
    };

    if (await snapDialog(snap, dialogParams)) {
      accountState.accountConfig.identity.didMethod = didMethod;
      await updateSnapState(snap, state);
      return true;
    }

    return false;
  }
  return true;
}
