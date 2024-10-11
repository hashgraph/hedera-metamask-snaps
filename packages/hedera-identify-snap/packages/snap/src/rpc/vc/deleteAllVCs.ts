import { IdentitySnapParams, SnapDialogParams } from '../../interfaces';
import {
  ClearOptions,
  IDataManagerClearArgs,
  IDataManagerClearResult,
  IDataManagerQueryResult,
} from '../../plugins/veramo/verifiable-creds-manager';
import { generateVCPanel, snapDialog } from '../../snap/dialog';
import { getAccountStateByCoinType } from '../../snap/state';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Function to delete all VCs.
 *
 * @param identitySnapParams - Identity snap params.
 * @param vcRequestParams - VC request params.
 */
export async function deleteAllVCs(
  identitySnapParams: IdentitySnapParams,
  vcRequestParams: IDataManagerClearArgs,
): Promise<IDataManagerClearResult[] | null> {
  const { origin, snap, state, account } = identitySnapParams;
  const { options } = vcRequestParams || {};
  const { store = 'snap' } = options || {};
  const optionsFiltered = { store } as ClearOptions;

  // Get Veramo agent
  const agent = await getVeramoAgent(snap, state);

  const accountState = await getAccountStateByCoinType(
    state,
    account.evmAddress,
  );
  const vcsToBeRemoved = (await agent.queryVC({
    filter: undefined,
    options: optionsFiltered,
    accessToken: accountState.accountConfig.identity.googleUserInfo.accessToken,
  })) as IDataManagerQueryResult[];

  const header = 'Delete all Verifiable Credentials';
  const prompt = `Are you sure you want to remove all your VCs from the store '${store}'?`;
  const description = `Note that this action cannot be reversed and you will need to recreate your VCs if you go through with it. Number of VCs to be removed is ${vcsToBeRemoved.length.toString()}`;
  const dialogParams: SnapDialogParams = {
    type: 'confirmation',
    content: await generateVCPanel(
      origin,
      header,
      prompt,
      description,
      vcsToBeRemoved,
    ),
  };

  if (await snapDialog(snap, dialogParams)) {
    // Remove all the Verifiable Credentials from the store
    return await agent.clearVCs({
      options: optionsFiltered,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    });
  }
  throw new Error('User rejected');
}
