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
import type {
  OnHomePageHandler,
  OnInstallHandler,
  OnRpcRequestHandler,
  OnUpdateHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import _ from 'lodash';
import { HelloUI } from './components/hello';
import { ShowAccountPrivateKeyUI } from './components/showAccountPrivateKey';
import { OnHomePageUI } from './custom-ui/onHome';
import { onInstallUI } from './custom-ui/onInstall';
import { onUpdateUI } from './custom-ui/onUpdate';
import { onUserInputUI } from './custom-ui/onUserInput';
import { SwitchDIDMethodFacade } from './facades/did/SwitchDIDMethodFacade';
import { GetAccountInfoFacade } from './facades/snap/GetAccountInfoFacade';
import { TogglePopupsFacade } from './facades/snap/TogglePopupsFacade';
import { SnapAccounts } from './snap/SnapAccounts';
import { SnapState } from './snap/SnapState';
import type { IdentifySnapParams } from './types/state';
import { EvmUtils } from './utils/EvmUtils';
import { ParamUtils } from './utils/ParamUtils';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  console.log('Request:', JSON.stringify(request, null, 4));
  console.log('Origin:', origin);
  console.log('-------------------------------------------------------------');

  let state = await SnapState.getStateUnchecked();
  if (_.isEmpty(state)) {
    state = await SnapState.initState();
  }

  const identifySnapParams: IdentifySnapParams = {
    origin,
    state,
  };

  // Get network
  const network = await EvmUtils.getChainId();

  switch (request.method) {
    case 'hello': {
      return await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: <HelloUI origin={origin} network={network} />,
        },
      });
    }
    case 'togglePopups': {
      return await TogglePopupsFacade.togglePopups(identifySnapParams);
    }
    case 'switchDIDMethod': {
      ParamUtils.isValidSwitchMethodRequest(request.params);
      return await SwitchDIDMethodFacade.switchDIDMethod(
        identifySnapParams,
        request.params.didMethod,
      );
    }
  }

  let isExternalAccount = false;
  if (ParamUtils.isExternalAccountFlagSet(request.params)) {
    isExternalAccount = true;
  }

  // Set current account
  await SnapAccounts.setCurrentAccount(
    origin,
    state,
    request.params,
    network,
    isExternalAccount,
  );

  const accountInfoPublic =
    await GetAccountInfoFacade.getAccountInfo(identifySnapParams);

  switch (request.method) {
    case 'getCurrentAccount':
      return {
        currentAccount: accountInfoPublic,
      };
    case 'showAccountPrivateKey':
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: (
            <ShowAccountPrivateKeyUI
              origin={origin}
              network={network}
              privateKey={
                state.accountState[state.currentAccount.snapEvmAddress][
                  state.currentAccount.network
                ].keyStore.privateKey
              }
              publicKey={state.currentAccount.publicKey}
              accountID={state.currentAccount.hederaAccountId}
              evmAddress={state.currentAccount.snapEvmAddress}
            />
          ),
        },
      });
      return {
        currentAccount: accountInfoPublic,
      };

    default:
      // Throw a known error to avoid crashing the Snap
      throw rpcErrors.methodNotFound(request.method);
  }
};

export const onHomePage: OnHomePageHandler = OnHomePageUI;

export const onUserInput: OnUserInputHandler = onUserInputUI;

export const onInstall: OnInstallHandler = onInstallUI;

export const onUpdate: OnUpdateHandler = onUpdateUI;
