import { IdentitySnapParams, SnapDialogParams } from '../../interfaces';
import {
  IDataManagerQueryArgs,
  IDataManagerQueryResult,
  QueryOptions,
} from '../../plugins/veramo/verifiable-creds-manager';
import { generateVCPanel, snapDialog } from '../../snap/dialog';
import { getAccountStateByCoinType } from '../../snap/state';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Function to get VCs.
 *
 * @param identitySnapParams - Identity snap params.
 * @param vcRequestParams - VC request params.
 */
export async function getVCs(
  identitySnapParams: IdentitySnapParams,
  vcRequestParams: IDataManagerQueryArgs,
): Promise<IDataManagerQueryResult[]> {
  const { origin, snap, state, account } = identitySnapParams;

  const { filter, options } = vcRequestParams || {};
  const { store = 'snap', returnStore = true } = options || {};

  // Get Veramo agent
  const agent = await getVeramoAgent(snap, state);

  // Get VCs
  const accountState = await getAccountStateByCoinType(
    state,
    account.evmAddress,
  );
  const optionsFiltered = { store, returnStore } as QueryOptions;
  const vcs = (await agent.queryVC({
    filter,
    options: optionsFiltered,
    accessToken: accountState.accountConfig.identity.googleUserInfo.accessToken,
  })) as IDataManagerQueryResult[];
  console.log('VCs: ', JSON.stringify(vcs, null, 4));

  const header = 'Retrieve Verifiable Credentials';
  const prompt = 'Are you sure you want to send VCs to the dApp?';
  const description = `Some dApps are less secure than others and could save data from VCs against your will. Be careful where you send your private VCs! Number of VCs submitted is ${vcs.length.toString()}`;
  const dialogParams: SnapDialogParams = {
    type: 'confirmation',
    content: await generateVCPanel(origin, header, prompt, description, vcs),
  };

  if (
    state.snapConfig.dApp.disablePopups ||
    (await snapDialog(snap, dialogParams))
  ) {
    return vcs;
  }

  return [];
}
