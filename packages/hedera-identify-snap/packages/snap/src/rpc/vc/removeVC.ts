import { IdentitySnapParams, SnapDialogParams } from '../../interfaces';
import {
  DeleteOptions,
  IDataManagerDeleteArgs,
  IDataManagerDeleteResult,
  IDataManagerQueryResult,
} from '../../plugins/veramo/verifiable-creds-manager';
import { generateVCPanel, snapDialog } from '../../snap/dialog';
import { getAccountStateByCoinType } from '../../snap/state';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Function to remove VC.
 *
 * @param identitySnapParams - Identity snap params.
 * @param vcRequestParams - VC request params.
 */
export async function removeVC(
  identitySnapParams: IdentitySnapParams,
  vcRequestParams: IDataManagerDeleteArgs,
): Promise<IDataManagerDeleteResult[] | null> {
  const { origin, snap, state, account } = identitySnapParams;

  const { id = '', options } = vcRequestParams || {};
  const { store = 'snap' } = options || {};
  const optionsFiltered = { store } as DeleteOptions;

  // Get Veramo agent
  const agent = await getVeramoAgent(snap, state);

  const ids = typeof id === 'string' ? [id] : id;
  if (ids.length === 0) {
    return null;
  }

  const accountState = await getAccountStateByCoinType(
    state,
    account.evmAddress,
  );
  const vcsToBeRemoved: IDataManagerQueryResult[] = [];
  for (const vcId of ids) {
    const vcs = (await agent.queryVC({
      filter: {
        type: 'id',
        filter: vcId,
      },
      options: optionsFiltered,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    })) as IDataManagerQueryResult[];
    if (vcs.length > 0) {
      vcsToBeRemoved.push(vcs[0]);
    }
  }

  const header = 'Remove specific Verifiable Credentials';
  const prompt = 'Are you sure you want to remove the following VCs?';
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
    // Remove the specified Verifiable Credentials from the store based on their IDs
    return Promise.all(
      ids.map(async (_id: string) => {
        return await agent.deleteVC({
          id: _id,
          options: optionsFiltered,
          accessToken:
            accountState.accountConfig.identity.googleUserInfo.accessToken,
        });
      }),
    ).then((data: IDataManagerDeleteResult[][]) => {
      return data.flat();
    });
  }
  throw new Error('User rejected');
}
