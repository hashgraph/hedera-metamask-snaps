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

import { DialogParams, divider, heading, text } from '@metamask/snaps-sdk';
import { ProofFormat, W3CVerifiableCredential } from '@veramo/core';
import { sha256 } from 'js-sha256';
import cloneDeep from 'lodash.clonedeep';
import { IdentitySnapParams } from '../../interfaces';
import {
  IDataManagerSaveResult,
  ISaveVC,
  QueryMetadata,
  SaveOptions,
} from '../../plugins/veramo/verifiable-creds-manager';
import { generateCommonPanel, snapDialog } from '../../snap/dialog';
import { getCurrentNetwork } from '../../snap/network';
import { getAccountStateByCoinType } from '../../snap/state';
import {
  CreateVCRequestParams,
  CreateVCResponseResult,
} from '../../types/params';
import { HederaUtils } from '../../utils/hederaUtils';
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
  const { origin, network, state, account } = identitySnapParams;

  // Get Veramo agent
  const agent = await getVeramoAgent(state);

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

  const dialogParams: DialogParams = {
    type: 'confirmation',
    content: await generateCommonPanel(origin, network, [
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

  if (await snapDialog(dialogParams)) {
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
    const chainId = await getCurrentNetwork();
    const accountState = await getAccountStateByCoinType(
      state,
      account.metamaskAddress,
    );
    if (HederaUtils.validHederaChainID(chainId)) {
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
    console.log(
      'verifiableCredential: ',
      JSON.stringify(verifiableCredential, null, 4),
    );

    // Save the Verifiable Credential to all the stores the user requested for
    const saved: IDataManagerSaveResult[] = await agent.saveVC({
      data: [
        {
          vc: verifiableCredential,
          id: sha256(JSON.stringify(verifiableCredential)),
        },
      ] as ISaveVC[],
      options: optionsFiltered,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    });

    // Retrieve the created Verifiable Credential
    const result: CreateVCResponseResult = {
      data: verifiableCredential as W3CVerifiableCredential,
      metadata: {
        id: saved[0].id,
        store: saved.map((res) => res.store),
      } as QueryMetadata,
    };

    console.log(
      'Created and saved verifiableCredential: ',
      JSON.stringify(result, null, 4),
    );
    return result;
  }
  throw new Error('User rejected');
}
