import {
  Account,
  IdentitySnapParams,
  IdentitySnapState,
  SnapDialogParams,
} from '../../interfaces';
import { verifyToken } from '../../plugins/veramo/google-drive-data-store';
import {
  IDataManagerQueryResult,
  IDataManagerSaveResult,
  ISaveVC,
  QueryOptions,
  SaveOptions,
} from '../../plugins/veramo/verifiable-creds-manager';
import { generateVCPanel, snapDialog } from '../../snap/dialog';
import { getAccountStateByCoinType } from '../../snap/state';
import { Agent, getVeramoAgent } from '../../veramo/agent';

/**
 * Function to sync Google VCs with snap.
 *
 * @param identitySnapParams - Identity snap params.
 */
export async function syncGoogleVCs(
  identitySnapParams: IdentitySnapParams,
): Promise<boolean> {
  const { origin, state, account } = identitySnapParams;

  try {
    // Get Veramo agent
    const agent = await getVeramoAgent(snap, state);

    const accountState = await getAccountStateByCoinType(
      state,
      account.evmAddress,
    );
    const gUserEmail = await verifyToken(
      accountState.accountConfig.identity.googleUserInfo.accessToken,
    );

    const options: QueryOptions = { store: 'snap', returnStore: true };
    // Get VCs from the snap state storage
    const snapVCs = (await agent.queryVC({
      filter: undefined,
      options,
    })) as IDataManagerQueryResult[];
    // Get VCs from google drive storage
    options.store = 'googleDrive';
    const googleVCs = (await agent.queryVC({
      filter: undefined,
      options,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    })) as IDataManagerQueryResult[];
    /* googleVCs = googleVCs.filter(
    (vc) =>
      (vc.data as VerifiableCredential).credentialSubject.id?.split(':')[4] ===
      account.evmAddress, // Note that we're only doing this because this is a did:pkh VC. We need to handle other VCs differently
  ); */

    const snapVCIds = snapVCs.map((vc) => vc.metadata.id);
    const googleVCIds = googleVCs.map((vc) => vc.metadata.id);

    const vcsNotInSnap = googleVCs.filter(
      (vc) => !snapVCIds.includes(vc.metadata.id),
    );
    console.log('vcsNotInSnap: ', JSON.stringify(vcsNotInSnap, null, 4));

    const vcsNotInGDrive = snapVCs.filter(
      (vc) => !googleVCIds.includes(vc.metadata.id),
    );
    console.log('vcsNotInGDrive: ', JSON.stringify(vcsNotInGDrive, null, 4));

    const header = 'Sync Verifiable Credentials';
    let vcsNotInSnapSync = true;
    if (vcsNotInSnap.length > 0) {
      vcsNotInSnapSync = await handleSync(
        state,
        account,
        agent,
        origin,
        `${header} - Import VCs from Google drive: ${gUserEmail}`,
        'Would you like to sync VCs in Google drive with Metamask snap?',
        'This action will import the VCs that are in Google drive to the Metamask snap',
        vcsNotInSnap,
        'snap',
      );
    }
    let vcsNotInGDriveSync = true;
    if (vcsNotInGDrive.length > 0) {
      vcsNotInGDriveSync = await handleSync(
        state,
        account,
        agent,
        origin,
        `${header} - Export VCs to Google drive: ${gUserEmail}`,
        'Would you like to sync VCs in Metamask snap with Google drive?',
        'This action will export the VCs that are in Metamask snap to Google drive',
        vcsNotInGDrive,
        'googleDrive',
      );
    }

    if (vcsNotInSnapSync && vcsNotInGDriveSync) {
      return true;
    }
  } catch (error) {
    console.error(
      'Could not sync Verifiable Credentials between the Metamask snap and Google Drive properly. Please try again',
      JSON.stringify(error, null, 4),
    );
    throw error;
  }

  console.log(
    'Could not sync Verifiable Credentials between the Metamask snap and Google drive properly. Please try again',
  );
  throw new Error(
    'Could not sync Verifiable Credentials between the Metamask snap and Google drive properly. Please try again',
  );
}

/**
 * Function to handle the snap dialog and import/export each VC.
 *
 * @param state - Identity state.
 * @param account - Currently connected account.
 * @param agent - Veramo.
 * @param origin - The origin of where the call is being made from.
 * @param header - Header text of the metamask dialog box(eg. 'Retrieve Verifiable Credentials').
 * @param prompt - Prompt text of the metamask dialog box(eg. 'Are you sure you want to send VCs to the dApp?').
 * @param description - Description text of the metamask dialog box(eg. 'Some dApps are less secure than others and could save data from VCs against your will. Be careful where you send your private VCs! Number of VCs submitted is 2').
 * @param vcs - The Verifiable Credentials to show on the metamask dialog box.
 * @param store - The snap store to use(snap or googleDrive).
 */
async function handleSync(
  state: IdentitySnapState,
  account: Account,
  agent: Agent,
  origin: string,
  header: string,
  prompt: string,
  description: string,
  vcs: IDataManagerQueryResult[],
  store: string,
): Promise<boolean> {
  const dialogParams: SnapDialogParams = {
    type: 'confirmation',
    content: await generateVCPanel(origin, header, prompt, description, vcs),
  };
  if (await snapDialog(snap, dialogParams)) {
    const options = {
      store,
    } as SaveOptions;
    const accountState = await getAccountStateByCoinType(
      state,
      account.evmAddress,
    );
    const data = vcs.map((x) => {
      return { vc: x.data, id: x.metadata.id } as ISaveVC;
    }) as ISaveVC[];
    const result: IDataManagerSaveResult[] = await agent.saveVC({
      data,
      options,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    });
    if (!(result.length > 0 && result[0].id !== '')) {
      console.log('Could not sync the vc: ', JSON.stringify(data, null, 4));
      return false;
    }
    return true;
  }
  console.log('User rejected the sync operation');
  return false;
}
