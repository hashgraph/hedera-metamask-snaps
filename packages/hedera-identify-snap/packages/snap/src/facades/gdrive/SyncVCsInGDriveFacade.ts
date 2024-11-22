/*-
 *
 * Hedera Identify Snap
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

import { rpcErrors } from '@metamask/rpc-errors';
import { DialogParams } from '@metamask/snaps-sdk';
import { verifyToken } from '../../plugins/veramo/google-drive-data-store';
import {
  IDataManagerQueryResult,
  IDataManagerSaveResult,
  ISaveVC,
  QueryOptions,
  SaveOptions,
} from '../../plugins/veramo/verifiable-creds-manager';
import { IdentifyAccountState, IdentifySnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';
import { Agent, getVeramoAgent } from '../../veramo/agent';

export class SyncVCsInGDriveFacade {
  /**
   * Function to sync VCs in Google Drive.
   *
   * @param identifySnapParams - Identify snap params.
   */
  public static async syncVCsBetweenSnapAndGDrive(
    identifySnapParams: IdentifySnapParams,
  ): Promise<boolean> {
    const { state } = identifySnapParams;
    const { snapEvmAddress, network } = state.currentAccount;

    const accountState = state.accountState[snapEvmAddress][network];

    let gUserEmail;
    try {
      gUserEmail = await verifyToken(
        accountState.accountConfig.identity.googleUserInfo.accessToken,
      );
    } catch (error) {
      console.error(
        `Failed to verify google access token: ${error}. Please reconfigure your Google account with "configureGoogleAccount" API`,
      );
      return false;
    }

    // Get Veramo agent
    const agent = await getVeramoAgent(state);
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
        network,
        accountState,
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
        network,
        accountState,
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

    return false;
  }
}

/**
 * Function to handle the snap dialog and import/export each VC.
 *
 * @param network- Network name.
 * @param accountState: Account state.
 * @param agent - Veramo.
 * @param origin - The origin of where the call is being made from.
 * @param header - Header text of the metamask dialog box(eg. 'Retrieve Verifiable Credentials').
 * @param prompt - Prompt text of the metamask dialog box(eg. 'Are you sure you want to send VCs to the dApp?').
 * @param description - Description text of the metamask dialog box(eg. 'Some dApps are less secure than others and could save data from VCs against your will. Be careful where you send your private VCs! Number of VCs submitted is 2').
 * @param vcs - The Verifiable Credentials to show on the metamask dialog box.
 * @param store - The snap store to use(snap or googleDrive).
 */
async function handleSync(
  network: string,
  accountState: IdentifyAccountState,
  agent: Agent,
  origin: string,
  header: string,
  prompt: string,
  description: string,
  vcs: IDataManagerQueryResult[],
  store: string,
): Promise<boolean> {
  const dialogParams: DialogParams = {
    type: 'confirmation',
    content: await SnapUtils.generateVCPanel(
      origin,
      network,
      header,
      prompt,
      description,
      vcs,
    ),
  };
  const confirmed = await SnapUtils.snapDialog(dialogParams);
  if (!confirmed) {
    const errMessage = 'User rejected the transaction';
    console.error(errMessage);
    throw rpcErrors.transactionRejected(errMessage);
  }

  const options = {
    store,
  } as SaveOptions;
  const data = vcs.map((x) => {
    return { vc: x.data, id: x.metadata.id } as ISaveVC;
  }) as ISaveVC[];
  const result: IDataManagerSaveResult[] = await agent.saveVC({
    data,
    options,
    accessToken: accountState.accountConfig.identity.googleUserInfo.accessToken,
  });
  if (!(result.length > 0 && result[0].id !== '')) {
    console.log('Could not sync the vc: ', JSON.stringify(data, null, 4));
    return false;
  }
  return true;
}
