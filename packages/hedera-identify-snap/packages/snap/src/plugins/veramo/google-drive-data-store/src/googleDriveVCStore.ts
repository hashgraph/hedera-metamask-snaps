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

import { VerifiableCredential } from '@veramo/core';
import { sha256 } from 'js-sha256';
import jsonpath from 'jsonpath';

import { getDidHederaIdentifier } from '../../../../did/hedera/hederaDidUtils';
import { getDidKeyIdentifier } from '../../../../did/key/keyDidUtils';
import { IdentifySnapState } from '../../../../types/state';
import {
  AbstractDataStore,
  IConfigureArgs,
  IFilterArgs,
  IQueryResult,
  ISaveVC,
} from '../../verifiable-creds-manager';
import {
  GOOGLE_DRIVE_VCS_FILE_NAME,
  createEmptyFile,
  getGoogleVCs,
  uploadToGoogleDrive,
  verifyToken,
} from './googleUtils';
import { decodeJWT } from './jwt';

/**
 * An implementation of {@link AbstractDataStore} that holds everything in snap state.
 *
 * This is usable by {@link @vc-manager/VCManager} to hold the vc data
 */
export class GoogleDriveVCStore extends AbstractDataStore {
  state: IdentifySnapState;
  accessToken: string;
  email: string;

  constructor(state: IdentifySnapState) {
    super();
    this.state = state;
    this.accessToken = '';
    this.email = '';
  }

  async queryVC(args: IFilterArgs): Promise<IQueryResult[]> {
    const { filter } = args;
    const account = this.state.currentAccount.snapEvmAddress;

    if (!account) {
      throw Error(
        `GoogleDriveVCStore - Cannot get current account: ${account}`,
      );
    }

    const googleVCs = await getGoogleVCs(
      this.accessToken,
      GOOGLE_DRIVE_VCS_FILE_NAME,
    );

    if (!googleVCs) {
      console.log('Invalid vcs file');
      return [];
    }

    const currentMethod = this.state.currentAccount.method;

    // Helper function to decode VC if it's in JWT format
    const decodeVC = (k: string) => {
      let vc = googleVCs[k] as unknown;
      if (typeof vc === 'string') {
        vc = decodeJWT(vc);
      }
      return { metadata: { id: k }, data: vc };
    };

    // Helper function to filter VCs by the current DID method
    const filterByMethod = (vc: any) => {
      const vcId = vc.data.credentialSubject.id || '';
      return vcId.startsWith(currentMethod); // Ensure VC matches the current DID method
    };

    const filteredVCs = Object.keys(googleVCs)
      .map(decodeVC)
      .filter(filterByMethod); // Filter VCs by method

    if (filter && filter.type === 'id') {
      return filteredVCs.filter((item) => item.metadata.id === filter.filter);
    }

    if (filter && filter.type === 'vcType') {
      return filteredVCs.filter((item) =>
        (item.data as VerifiableCredential).type?.includes(filter.filter),
      );
    }

    if (!filter || filter.type === 'none') {
      return filteredVCs;
    }

    if (filter && filter.type === 'JSONPath') {
      const filteredObjects = jsonpath.query(
        filteredVCs,
        filter.filter as string,
      );
      return filteredObjects as IQueryResult[];
    }

    return [];
  }

  async saveVC(args: { data: ISaveVC[] }): Promise<string[]> {
    const { data: vcs } = args;
    const account = this.state.currentAccount.snapEvmAddress;

    if (!account) {
      throw Error(
        `GoogleDriveVCStore - Cannot get current account: ${account}`,
      );
    }

    let googleVCs = await getGoogleVCs(
      this.accessToken,
      GOOGLE_DRIVE_VCS_FILE_NAME,
    );

    if (!googleVCs) {
      await createEmptyFile(this.accessToken, GOOGLE_DRIVE_VCS_FILE_NAME);
      googleVCs = {};
    }

    const ids: string[] = [];
    const newVCs = { ...googleVCs };
    const currentMethod = this.state.currentAccount.method;

    for (const vc of vcs) {
      let identifier = this.state.currentAccount.snapEvmAddress;
      if (currentMethod === 'did:key') {
        identifier = getDidKeyIdentifier(this.state.currentAccount.publicKey);
      } else if (currentMethod === 'did:hedera') {
        identifier = getDidHederaIdentifier(
          this.state.accountState[this.state.currentAccount.snapEvmAddress][
            this.state.currentAccount.network
          ],
          currentMethod,
        );
      }

      const vcId = (vc.vc as VerifiableCredential).credentialSubject.id || '';
      if (
        vcId.startsWith(currentMethod) &&
        vcId.split(':').pop() === identifier
      ) {
        const newId = vc.id || sha256(JSON.stringify(vc));
        newVCs[newId] = vc.vc;
        ids.push(newId);
      }
    }

    await uploadToGoogleDrive(this.accessToken, {
      fileName: GOOGLE_DRIVE_VCS_FILE_NAME,
      content: JSON.stringify(newVCs),
    });

    return ids;
  }

  async deleteVC({ id }: { id: string }): Promise<boolean> {
    const account = this.state.currentAccount.snapEvmAddress;

    if (!account) {
      throw Error(
        `GoogleDriveVCStore - Cannot get current account: ${account}`,
      );
    }

    const googleVCs = await getGoogleVCs(
      this.accessToken,
      GOOGLE_DRIVE_VCS_FILE_NAME,
    );

    if (!googleVCs || !googleVCs[id]) {
      console.log(`VC ID '${id}' not found`);
      return false;
    }

    const currentMethod = this.state.currentAccount.method;
    let identifier = this.state.currentAccount.snapEvmAddress;
    if (currentMethod === 'did:key') {
      identifier = getDidKeyIdentifier(this.state.currentAccount.publicKey);
    } else if (currentMethod === 'did:hedera') {
      identifier = getDidHederaIdentifier(
        this.state.accountState[this.state.currentAccount.snapEvmAddress][
          this.state.currentAccount.network
        ],
        currentMethod,
      );
    }

    const vcId =
      (googleVCs[id] as VerifiableCredential).credentialSubject.id || '';
    if (
      !vcId.startsWith(currentMethod) ||
      vcId.split(':').pop() !== identifier
    ) {
      console.log(
        `GoogleDriveVCStore - VC ID '${id}' does not match the current account.`,
      );
      return false;
    }

    delete googleVCs[id];
    await uploadToGoogleDrive(this.accessToken, {
      fileName: GOOGLE_DRIVE_VCS_FILE_NAME,
      content: JSON.stringify(googleVCs),
    });

    return true;
  }

  public async clearVCs(_args: IFilterArgs): Promise<boolean> {
    const account = this.state.currentAccount.snapEvmAddress;

    if (!account) {
      throw Error(
        `GoogleDriveVCStore - Cannot get current account: ${account}`,
      );
    }

    const googleVCs = await getGoogleVCs(
      this.accessToken,
      GOOGLE_DRIVE_VCS_FILE_NAME,
    );

    if (!googleVCs) {
      await createEmptyFile(this.accessToken, GOOGLE_DRIVE_VCS_FILE_NAME);
      console.log('No VCs to clear.');
      return false;
    }

    const currentMethod = this.state.currentAccount.method; // 'did:key' or 'did:pkh'

    // Use Object.fromEntries to filter VCs like in SnapVCStore
    const filteredVCs = Object.fromEntries(
      Object.entries(googleVCs).filter(([_, vc]) => {
        const vcSubjectId =
          (vc as VerifiableCredential).credentialSubject.id || '';
        return !vcSubjectId.startsWith(currentMethod); // Keep only VCs not matching the current method
      }),
    );

    await uploadToGoogleDrive(this.accessToken, {
      fileName: GOOGLE_DRIVE_VCS_FILE_NAME,
      content: JSON.stringify(filteredVCs),
    });

    return true;
  }

  public async configure({ accessToken }: IConfigureArgs): Promise<boolean> {
    try {
      const email = await verifyToken(accessToken);
      this.accessToken = accessToken;
      this.email = email;
      return true;
    } catch (error) {
      console.error('Could not configure Google account', error);
      throw error;
    }
  }
}
