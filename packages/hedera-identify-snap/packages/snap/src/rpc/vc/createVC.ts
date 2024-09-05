import { divider, heading, text } from '@metamask/snaps-ui';
import { ProofFormat, W3CVerifiableCredential } from '@veramo/core';
import cloneDeep from 'lodash.clonedeep';
import { v4 as uuidv4 } from 'uuid';
import { validHederaChainID } from '../../hedera/config';
import { IdentitySnapParams, SnapDialogParams } from '../../interfaces';
import {
  IDataManagerSaveResult,
  ISaveVC,
  SaveOptions,
} from '../../plugins/veramo/verifiable-creds-manager';
import { generateCommonPanel, snapDialog } from '../../snap/dialog';
import { getCurrentNetwork } from '../../snap/network';
import { getAccountStateByCoinType } from '../../snap/state';
import {
  CreateVCRequestParams,
  CreateVCResponseResult,
} from '../../types/params';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Function to create VC.
 *
 * @param identitySnapParams - Identity snap params.
 * @param vcRequestParams - VC request params.
 */
export async function createVC(
  identitySnapParams: IdentitySnapParams,
  vcRequestParams: CreateVCRequestParams,
): Promise<CreateVCResponseResult> {
  const { origin, snap, state, metamask, account } = identitySnapParams;

  // Get Veramo agent
  const agent = await getVeramoAgent(snap, state);

  // GET DID
  const { did } = account.identifier;

  const {
    vcKey = 'vcData',
    vcValue,
    credTypes = [],
    options,
  } = vcRequestParams || {};
  const { store = 'snap' } = options || {};
  const optionsFiltered = { store } as SaveOptions;

  const dialogParams: SnapDialogParams = {
    type: 'confirmation',
    content: await generateCommonPanel(origin, [
      heading('Create Verifiable Credential'),
      text('Would you like to create and save the following VC in the snap?'),
      divider(),
      text(
        JSON.stringify({
          [vcKey]: vcValue,
        }),
      ),
    ]),
  };

  if (await snapDialog(snap, dialogParams)) {
    const issuanceDate = new Date();
    // Set the expiration date to be 1 year from the date it's issued
    const expirationDate = cloneDeep(issuanceDate);
    expirationDate.setFullYear(
      issuanceDate.getFullYear() + 1,
      issuanceDate.getMonth(),
      issuanceDate.getDate(),
    );

    const credential = new Map<string, unknown>();
    credential.set('issuanceDate', issuanceDate.toISOString()); // the entity that issued the credential+
    credential.set('expirationDate', expirationDate.toISOString()); // when the credential was issued
    credential.set('type', credTypes);

    const issuer: { id: string; hederaAccountId?: string } = { id: did };
    const credentialSubject: { id: string; hederaAccountId?: string } = {
      id: did, // identifier for the only subject of the credential
      [vcKey]: vcValue, // assertion about the only subject of the credential
    };
    const chainId = await getCurrentNetwork(metamask);
    const accountState = await getAccountStateByCoinType(
      state,
      account.evmAddress,
    );
    if (validHederaChainID(chainId)) {
      const hederaAccountId = accountState.extraData as string;
      issuer.hederaAccountId = hederaAccountId;
      credentialSubject.hederaAccountId = hederaAccountId;
    }
    credential.set('issuer', issuer); // the entity that issued the credential
    credential.set('credentialSubject', credentialSubject);

    // Generate a Verifiable Credential
    const verifiableCredential: W3CVerifiableCredential =
      await agent.createVerifiableCredential({
        credential: JSON.parse(JSON.stringify(Object.fromEntries(credential))),
        // digital proof that makes the credential tamper-evident
        proofFormat: 'jwt' as ProofFormat,
      });

    // Save the Verifiable Credential to all the stores the user requested for
    const saved: IDataManagerSaveResult[] = await agent.saveVC({
      data: [{ vc: verifiableCredential, id: uuidv4() }] as ISaveVC[],
      options: optionsFiltered,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    });

    // Retrieve the created Verifiable Credential
    const result: CreateVCResponseResult = {
      data: verifiableCredential,
      metadata: {
        id: saved[0].id,
        store: saved.map((res) => res.store),
      },
    };

    console.log(
      'Created and saved verifiableCredential: ',
      JSON.stringify(result, null, 4),
    );
    return result;
  }
  throw new Error('User rejected');
}
