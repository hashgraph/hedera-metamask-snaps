import { SnapsGlobalObject } from '@metamask/snaps-types';
import { divider, heading, panel, Panel, text } from '@metamask/snaps-ui';
import { VerifiableCredential } from '@veramo/core';
import _ from 'lodash';
import cloneDeep from 'lodash.clonedeep';
import { IdentitySnapState, SnapDialogParams } from '../interfaces';
import { IDataManagerQueryResult } from '../plugins/veramo/verifiable-creds-manager';
import { updateSnapState } from './state';

/**
 * Function that toggles the disablePopups flag in the config.
 *
 * @param snap - Snap.
 * @param state - IdentitySnapState.
 */
export async function updatePopups(
  snap: SnapsGlobalObject,
  state: IdentitySnapState,
) {
  state.snapConfig.dApp.disablePopups = !state.snapConfig.dApp.disablePopups;
  await updateSnapState(snap, state);
}

/**
 * Function that opens snap dialog.
 *
 * @param snap - Snap.
 * @param params - Snap dialog params.
 */
export async function snapDialog(
  snap: SnapsGlobalObject,
  params: SnapDialogParams,
): Promise<string | boolean | null> {
  return (await snap.request({
    method: 'snap_dialog',
    params,
  })) as boolean;
}

/**
 * Function to generate snap dialog panel.
 *
 * @param origin - The origin of where the call is being made from.
 * @param prompt - Prompt text of the metamask dialog box(eg. 'Are you sure you want to send VCs to the dApp?').
 */
export async function generateCommonPanel(
  origin: string,
  prompt: any[],
): Promise<Panel> {
  const panelToShow = [text(`Origin: ${origin}`), divider(), ...prompt];
  return panel(panelToShow);
}

/**
 * Function to generate snap dialog panel for VC related functions.
 *
 * @param origin - The origin of where the call is being made from.
 * @param header - Header text of the metamask dialog box(eg. 'Retrieve Verifiable Credentials').
 * @param prompt - Prompt text of the metamask dialog box(eg. 'Are you sure you want to send VCs to the dApp?').
 * @param description - Description text of the metamask dialog box(eg. 'Some dApps are less secure than others and could save data from VCs against your will. Be careful where you send your private VCs! Number of VCs submitted is 2').
 * @param vcs - The Verifiable Credentials to show on the metamask dialog box.
 */
export async function generateVCPanel(
  origin: string,
  header: string,
  prompt: string,
  description: string,
  vcs: IDataManagerQueryResult[],
): Promise<Panel> {
  const vcsToUse = cloneDeep(vcs);
  const panelToShow = [
    text(`Origin: ${origin}`),
    divider(),
    heading(header),
    text(prompt),
    divider(),
    text(description),
  ];
  vcsToUse.forEach((vc, index) => {
    const vcData = vc.data as VerifiableCredential;
    delete vcData.credentialSubject.id;
    delete vcData.credentialSubject.hederaAccountId;
    panelToShow.push(divider());

    const credentialNumber = (index + 1).toString();
    panelToShow.push(text(`Credential #${credentialNumber}`));
    panelToShow.push(divider());

    panelToShow.push(text('ID: '));
    panelToShow.push(
      text(_.isEmpty(vc.metadata.id) ? credentialNumber : vc.metadata.id),
    );

    panelToShow.push(text('STORAGE: '));
    panelToShow.push(text(vc.metadata.store as string));

    panelToShow.push(text('TYPE:'));
    panelToShow.push(text(JSON.stringify(vcData.type)));

    panelToShow.push(text('SUBJECT:'));
    panelToShow.push(text(JSON.stringify(vcData.credentialSubject)));

    panelToShow.push(text('ISSUANCE DATE:'));
    const issuanceDate = new Date(vcData.issuanceDate as string).toLocaleString(
      undefined,
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'long',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        second: '2-digit',
      },
    );
    panelToShow.push(text(issuanceDate));

    panelToShow.push(text('EXPIRATION DATE:'));
    let expirationDate = 'Does not expire';
    if (vcData.expirationDate) {
      expirationDate = new Date(vcData.expirationDate as string).toLocaleString(
        undefined,
        {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          weekday: 'long',
          hour: '2-digit',
          hour12: false,
          minute: '2-digit',
          second: '2-digit',
        },
      );
    }
    panelToShow.push(text(expirationDate));
  });
  return panel(panelToShow);
}

/**
 * Request Hedera Account Id.
 *
 * @param snap - SnapGlobalObject.
 * @param prevHederaAccountId - HederaIdentifier.
 */
export async function requestHederaAccountId(
  snap: SnapsGlobalObject,
  prevHederaAccountId?: string,
): Promise<string> {
  const dialogParamsForHederaAccountId: SnapDialogParams = {
    type: 'prompt',
    content: await generateCommonPanel(origin, [
      heading('Connect to Hedera Account'),
      prevHederaAccountId
        ? text(
            `You had previously set your account Id to be ${prevHederaAccountId} however, this is not the correct account Id associated with this account. Please re-enter your account Id`,
          )
        : text(`Enter your hedera account Id associated with this account`),
    ]),
    placeholder: '0.0.3658062',
  };
  return (await snapDialog(snap, dialogParamsForHederaAccountId)) as string;
}
