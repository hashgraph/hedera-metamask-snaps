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
import { DialogParams, divider, heading, text } from '@metamask/snaps-sdk';
import { ProofFormat, W3CVerifiableCredential } from '@veramo/core';
import { sha256 } from 'js-sha256';
import cloneDeep from 'lodash.clonedeep';
import {
  IDataManagerQueryResult,
  IDataManagerSaveArgs,
  IDataManagerSaveResult,
  ISaveVC,
  QueryMetadata,
  SaveOptions,
} from '../../plugins/veramo/verifiable-creds-manager';
import {
  CreateVCRequestParams,
  CreateVCResponseResult,
} from '../../types/params';
import { IdentifySnapParams } from '../../types/state';
import { HederaUtils } from '../../utils/HederaUtils';
import { SnapUtils } from '../../utils/SnapUtils';
import { getVeramoAgent } from '../../veramo/agent';

export class SaveVCFacade {
  /**
   * Function to create vc.
   *
   * @param identifySnapParams - Identify snap params.
   */
  public static async createVC(
    identitySnapParams: IdentifySnapParams,
    vcRequestParams: CreateVCRequestParams,
  ): Promise<CreateVCResponseResult> {
    const { state } = identitySnapParams;
    const { snapEvmAddress, network, identifier, method } =
      state.currentAccount;

    // Get Veramo agent
    const agent = await getVeramoAgent(state);

    // GET DID
    const { did } = identifier;

    const {
      vcKey = 'vcData',
      vcValue,
      credTypes = [],
      options,
    } = vcRequestParams || {};
    const { store = 'snap' } = options || {};
    const optionsFiltered = { store } as SaveOptions;

    const panelToShow = [
      heading('Create Verifiable Credential'),
      text('Would you like to create and save the following VC in the snap?'),
      divider(),
      text(
        JSON.stringify({
          [vcKey]: vcValue,
        }),
      ),
    ];
    const dialogParams: DialogParams = {
      type: 'confirmation',
      content: await SnapUtils.generateCommonPanel(
        origin,
        network,
        panelToShow,
      ),
    };

    const confirmed = await SnapUtils.snapDialog(dialogParams);
    if (!confirmed) {
      const errMessage = 'User rejected the transaction';
      console.error(errMessage);
      throw rpcErrors.transactionRejected(errMessage);
    }

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
    const accountState = state.accountState[snapEvmAddress][network];
    if (HederaUtils.validHederaNetwork(network) || method === 'did:hedera') {
      const hederaAccountId = accountState.accountInfo.accountId;
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
    if (saved.length === 0) {
      throw new Error('Failed to save the VC');
    }

    // Retrieve the created Verifiable Credential
    const result: CreateVCResponseResult = {
      data: verifiableCredential as W3CVerifiableCredential,
      metadata: {
        id: saved[0].id,
        store: saved.map((res) => res.store),
      } as QueryMetadata,
    };
    return result;
  }

  /**
   * Function to save vc.
   *
   * @param identifySnapParams - Identify snap params.
   */
  public static async saveVC(
    identitySnapParams: IdentifySnapParams,
    vcRequestParams: IDataManagerSaveArgs,
  ): Promise<IDataManagerSaveResult[]> {
    const { state } = identitySnapParams;
    const { snapEvmAddress, network } = state.currentAccount;

    const { data: verifiableCredentials, options } = vcRequestParams || {};
    const { store = 'snap' } = options || {};
    const optionsFiltered = { store } as SaveOptions;

    const header = 'Save Verifiable Credentials';
    const prompt = `Are you sure you want to save the following VCs in ${
      typeof store === 'string' ? store : store.join(', ')
    }?`;
    const description = `Number of VCs submitted is ${(
      verifiableCredentials as W3CVerifiableCredential[]
    ).length.toString()}`;

    const vcsWithMetadata: IDataManagerQueryResult[] = [];
    // Iterate through vcs
    (verifiableCredentials as W3CVerifiableCredential[]).forEach(
      function (vc, index) {
        vcsWithMetadata.push({
          data: vc,
          metadata: {
            id: `External VC #${(index + 1).toString()}`,
            store: 'snap',
          },
        });
      },
    );
    const dialogParams: DialogParams = {
      type: 'confirmation',
      content: await SnapUtils.generateVCPanel(
        origin,
        network,
        header,
        prompt,
        description,
        vcsWithMetadata,
      ),
    };

    const confirmed = await SnapUtils.snapDialog(dialogParams);
    if (!confirmed) {
      const errMessage = 'User rejected the transaction';
      console.error(errMessage);
      throw rpcErrors.transactionRejected(errMessage);
    }

    // Save the Verifiable Credential
    const accountState = state.accountState[snapEvmAddress][network];
    const filteredCredentials: W3CVerifiableCredential[] = (
      verifiableCredentials as W3CVerifiableCredential[]
    ).filter((x: W3CVerifiableCredential) => {
      const vcObj = JSON.parse(JSON.stringify(x));

      const subjectDid: string = vcObj.credentialSubject.id;
      const subjectAccount = subjectDid.split(':')[4];
      return snapEvmAddress === subjectAccount;
    });

    // Save the Verifiable Credential to all the stores the user requested for
    const agent = await getVeramoAgent(state);
    const saved: IDataManagerSaveResult[] = await agent.saveVC({
      data: (filteredCredentials as W3CVerifiableCredential[]).map(
        (x: W3CVerifiableCredential) => {
          return { vc: x } as ISaveVC;
        },
      ) as ISaveVC[],
      options: optionsFiltered,
      accessToken:
        accountState.accountConfig.identity.googleUserInfo.accessToken,
    });

    if (saved.length === 0) {
      throw new Error('Failed to save the VC');
    }

    return saved;
  }
}
