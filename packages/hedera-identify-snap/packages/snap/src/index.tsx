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
import { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { HelloUI } from './components/hello';
import { Account, ExternalAccount, IdentitySnapParams } from './interfaces';
import { getAccountInfo } from './rpc/account/getAccountInfo';
import { getAvailableDIDMethods } from './rpc/did/getAvailableDIDMethods';
import { getCurrentDIDMethod } from './rpc/did/getCurrentDIDMethod';
import { resolveDID } from './rpc/did/resolveDID';
import { switchDIDMethod } from './rpc/did/switchDIDMethod';
import { configureGoogleAccount } from './rpc/gdrive/configureGoogleAccount';
import { togglePopups } from './rpc/snap/togglePopups';
import { createVC } from './rpc/vc/createVC';
import { createVP } from './rpc/vc/createVP';
import { deleteAllVCs } from './rpc/vc/deleteAllVCs';
import { getSupportedProofFormats } from './rpc/vc/getSupportedProofFormats';
import { getVCs } from './rpc/vc/getVCs';
import { removeVC } from './rpc/vc/removeVC';
import { saveVC } from './rpc/vc/saveVC';
import { syncGoogleVCs } from './rpc/vc/syncGoogleVCs';
import { verifyVC } from './rpc/vc/verifyVC';
import { verifyVP } from './rpc/vc/verifyVP';
import { getCurrentAccount } from './snap/account';
import { getCurrentNetwork } from './snap/network';
import { getStateUnchecked } from './snap/state';
import { init } from './utils/init';
import {
  isExternalAccountFlagSet,
  isValidConfigueGoogleRequest,
  isValidCreateVCRequest,
  isValidCreateVPRequest,
  isValidDeleteAllVCsRequest,
  isValidGetVCsRequest,
  isValidMetamaskAccountParams,
  isValidRemoveVCRequest,
  isValidResolveDIDRequest,
  isValidSaveVCRequest,
  isValidSwitchMethodRequest,
  isValidVerifyVCRequest,
  isValidVerifyVPRequest,
} from './utils/params';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.request - A validated JSON-RPC request object.
 * @param args.origin - Origin of the request.
 * @returns `null` if the request succeeded.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  console.log('Request:', JSON.stringify(request, null, 4));
  console.log('Origin:', origin);
  console.log('-------------------------------------------------------------');

  const network = await getCurrentNetwork();

  let state = await getStateUnchecked();
  if (state === null) {
    state = await init(origin, network);
  }
  console.log('state:', JSON.stringify(state, null, 4));

  const identitySnapParams: IdentitySnapParams = {
    origin,
    network,
    state,
    account: {} as Account,
  };

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
      return await togglePopups(identitySnapParams);
    }
    case 'switchDIDMethod': {
      isValidSwitchMethodRequest(request.params);
      return await switchDIDMethod(
        identitySnapParams,
        request.params.didMethod,
      );
    }
  }

  let isExternalAccount: boolean;
  let extraData: unknown;
  if (isExternalAccountFlagSet(request.params)) {
    isExternalAccount = true;
    extraData = (request.params as ExternalAccount).externalAccount.data;
  } else {
    isExternalAccount = false;
    isValidMetamaskAccountParams(request.params);
  }

  const account: Account = await getCurrentAccount(
    origin,
    network,
    state,
    request.params,
    isExternalAccount,
  );
  account.extraData = extraData;

  identitySnapParams.account = account;

  const accountInfoPublic = await getAccountInfo(identitySnapParams);

  switch (request.method) {
    case 'getAccountInfo': {
      return accountInfoPublic;
    }
    case 'resolveDID': {
      isValidResolveDIDRequest(request.params);
      return await resolveDID(identitySnapParams, request.params.did);
    }

    case 'getVCs': {
      isValidGetVCsRequest(request.params);
      return await getVCs(identitySnapParams, request.params);
    }

    case 'saveVC': {
      isValidSaveVCRequest(request.params);
      return await saveVC(identitySnapParams, request.params);
    }

    case 'createVC': {
      isValidCreateVCRequest(request.params);
      return await createVC(identitySnapParams, request.params);
    }

    case 'verifyVC': {
      isValidVerifyVCRequest(request.params);
      return await verifyVC(
        identitySnapParams,
        request.params.verifiableCredential,
      );
    }

    case 'removeVC': {
      isValidRemoveVCRequest(request.params);
      return await removeVC(identitySnapParams, request.params);
    }

    case 'deleteAllVCs': {
      isValidDeleteAllVCsRequest(request.params);
      return await deleteAllVCs(identitySnapParams, request.params);
    }

    case 'createVP': {
      isValidCreateVPRequest(request.params);
      return await createVP(identitySnapParams, request.params);
    }

    case 'verifyVP': {
      isValidVerifyVPRequest(request.params);
      return await verifyVP(
        identitySnapParams,
        request.params.verifiablePresentation,
      );
    }

    case 'getAvailableMethods': {
      return getAvailableDIDMethods();
    }

    case 'getCurrentDIDMethod': {
      return getCurrentDIDMethod(identitySnapParams);
    }

    case 'getSupportedProofFormats': {
      return getSupportedProofFormats();
    }

    case 'configureGoogleAccount': {
      isValidConfigueGoogleRequest(request.params);
      return await configureGoogleAccount(identitySnapParams, request.params);
    }

    case 'syncGoogleVCs': {
      return await syncGoogleVCs(identitySnapParams);
    }

    default:
      // Throw a known error to avoid crashing the Snap
      throw rpcErrors.methodNotFound(request.method);
  }
};
