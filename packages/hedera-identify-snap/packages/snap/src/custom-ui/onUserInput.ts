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

import type { DialogParams, OnUserInputHandler } from '@metamask/snaps-sdk';

import {
  UserInputEventType,
  copyable,
  divider,
  heading,
  text,
} from '@metamask/snaps-sdk';
import { W3CVerifiableCredential } from '@veramo/core';
import _ from 'lodash';
import { ResolveDIDFacade } from '../facades/did/ResolveDIDFacade';
import { SwitchDIDMethodFacade } from '../facades/did/SwitchDIDMethodFacade';
import { GetVCsFacade } from '../facades/vc/GetVCsFacade';
import { SaveVCFacade } from '../facades/vc/SaveVCFacade';
import { CreateVPFacade } from '../facades/vp/CreateVPFacade';
import {
  IDataManagerQueryArgs,
  IDataManagerQueryResult,
} from '../plugins/veramo/verifiable-creds-manager';
import { SnapAccounts } from '../snap/SnapAccounts';
import { SnapState } from '../snap/SnapState';
import {
  CreateVCRequestParams,
  CreateVPRequestParams,
  ProofInfo,
  ResolveDIDRequestParams,
  SwitchMethodRequestParams,
} from '../types/params';
import type { IdentifySnapParams } from '../types/state';
import { EvmUtils } from '../utils/EvmUtils';
import { ParamUtils } from '../utils/ParamUtils';
import { SnapUtils } from '../utils/SnapUtils';

export const onUserInputUI: OnUserInputHandler = async ({ event }) => {
  // Ensure valid event structure
  if (!event || !event.name) {
    console.warn('Invalid event detected:', event);
    return;
  }

  // Ignore InputChangeEvent explicitly
  if (event.type === UserInputEventType.InputChangeEvent) {
    console.warn('Ignoring InputChangeEvent:', event.name);
    return;
  }

  // Set origin to be the current page
  const origin = 'Identify Snap';

  let state = await SnapState.getStateUnchecked();
  if (_.isEmpty(state)) {
    state = await SnapState.initState();
  }

  // Get network
  const network = await EvmUtils.getChainId();

  // Set current account
  const snapAddress = await SnapAccounts.setCurrentAccount(
    origin,
    state,
    null,
    network,
    false,
    true,
  );

  const identifySnapParams: IdentifySnapParams = {
    origin,
    state,
  };

  let showDialog = true;
  const panelToShow = SnapUtils.initializePanelToShow();
  panelToShow.push(heading('Execution Details'), divider());

  // Prevent duplicate handling by ensuring unique event execution
  if (event.type === UserInputEventType.FormSubmitEvent) {
    switch (event.name) {
      case 'form-switch-did-method': {
        try {
          const params = {
            didMethod: event.value.didMethod,
          } as SwitchMethodRequestParams;
          ParamUtils.isValidSwitchMethodRequest(params);
          const switched = await SwitchDIDMethodFacade.switchDIDMethod(
            identifySnapParams,
            params.didMethod,
          );
          if (switched) {
            panelToShow.push(text('Switched DID method successfully'));
          } else {
            panelToShow.push(text('Failed to switch DID method'));
          }
        } catch (error) {
          console.error('Error switching DID method:', error);
          panelToShow.push(text('Failed to switch DID method'));
        }
        break;
      }
      case 'form-resolve-did': {
        try {
          const params = {
            did: event.value.did || state.currentAccount.identifier.did,
          } as ResolveDIDRequestParams;
          console.log('params', JSON.stringify(params, null, 2));
          ParamUtils.isValidResolveDIDRequest(params);
          console.log('verified valid resolve did request');
          const result = await ResolveDIDFacade.resolveDID(
            identifySnapParams,
            params.did,
          );
          console.log('result', JSON.stringify(result, null, 2));
          if (!_.isEmpty(result)) {
            panelToShow.push(
              text('Result: '),
              copyable({ value: JSON.stringify(result) }),
            );
          } else {
            panelToShow.push(text('Failed to resolve DID'));
          }
        } catch (error) {
          console.error('Error resolving DID:', error);
          panelToShow.push(text('Failed to resolve DID'));
        }
        break;
      }
      case 'form-create-vc': {
        try {
          const params = {
            vcKey: 'vcText',
            vcValue: event.value.vcText,
            credTypes: ['TextCredential'],
            options: {
              store: 'snap',
            },
          } as CreateVCRequestParams;
          ParamUtils.isValidCreateVCRequest(params);
          const result = await SaveVCFacade.createVC(
            identifySnapParams,
            params,
          );
          if (!_.isEmpty(result)) {
            panelToShow.push(
              text('Result: '),
              copyable({ value: JSON.stringify(result.data) }),
            );
          } else {
            panelToShow.push(text('Failed to create VC'));
          }
        } catch (error) {
          console.error('Error creating VC:', error);
          panelToShow.push(text('Failed to create VC'));
        }
        break;
      }
      case 'form-get-vcs': {
        try {
          const params = {
            options: {
              store: 'snap',
            },
          } as IDataManagerQueryArgs;
          ParamUtils.isValidGetVCsRequest(params);
          const result = await GetVCsFacade.getVCs(identifySnapParams, params);
          if (!_.isEmpty(result)) {
            result.forEach((vc: IDataManagerQueryResult, index: number) => {
              panelToShow.push(
                text(`VC #${index + 1}:`),
                copyable({ value: JSON.stringify(vc.data) }),
                divider(),
              );
            });
          } else {
            panelToShow.push(text('No VCs found.'));
          }
        } catch (error) {
          console.error('Error getting VCs:', error);
          panelToShow.push(text('Failed to get VCs'));
        }
        break;
      }
      case 'form-create-vp': {
        try {
          const proofInfo: ProofInfo = {
            proofFormat: 'jwt',
          };
          const params = {
            vcs: [
              JSON.parse(
                event.value.vcData as string,
              ) as W3CVerifiableCredential,
            ],
            proofInfo,
            options: {
              store: 'snap',
            },
          } as CreateVPRequestParams;

          ParamUtils.isValidCreateVPRequest(params);
          const result = await CreateVPFacade.createVP(
            identifySnapParams,
            params,
          );
          if (!_.isEmpty(result)) {
            panelToShow.push(
              text('Result: '),
              copyable({ value: JSON.stringify(result) }),
            );
          } else {
            panelToShow.push(text('Failed to create VP'));
          }
        } catch (error) {
          console.error('Error creating VP:', error);
          panelToShow.push(text('Failed to create VP'));
        }
        break;
      }
      default: {
        console.warn('No logic defined for this form name:', event.name);
        showDialog = false;
      }
    }
  } else if (event.type === UserInputEventType.ButtonClickEvent) {
    switch (event.name) {
      case 'btn-export-snap-account-private-key': {
        panelToShow.push(
          text(
            'Warning: Never disclose this key. Anyone with your private keys can steal any assets held in your account.',
          ),
          copyable({
            value: state.accountState[snapAddress][network].keyStore.privateKey,
            sensitive: true,
          }),
        );
        break;
      }
      default: {
        console.warn('No logic defined for this button name:', event.name);
        showDialog = false;
      }
    }
  } else {
    console.warn('Unhandled event type:', event.type);
    showDialog = false;
  }

  const dialogParams: DialogParams = {
    type: 'alert',
    content: await SnapUtils.generateCommonPanel(origin, network, panelToShow),
  };
  if (showDialog) {
    await SnapUtils.snapDialog(dialogParams);
  }
};
