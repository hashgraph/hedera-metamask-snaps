import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { heading, text } from '@metamask/snaps-ui';
import { Account, ExternalAccount, IdentitySnapParams } from './interfaces';
import { getAccountInfo } from './rpc/account/getAccountInfo';
import { getAvailableDIDMethods } from './rpc/did/getAvailableDIDMethods';
import { getCurrentDIDMethod } from './rpc/did/getCurrentDIDMethod';
import { resolveDID } from './rpc/did/resolveDID';
import { switchDIDMethod } from './rpc/did/switchDIDMethod';
import { configureGoogleAccount } from './rpc/gdrive/configureGoogleAccount';
import { createNewHederaAccount } from './rpc/hedera/createNewHederaAccount';
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
import { generateCommonPanel } from './snap/dialog';
import { getSnapStateUnchecked } from './snap/state';
import { CreateNewHederaAccountRequestParams } from './types/params';
import { init } from './utils/init';
import {
  isExternalAccountFlagSet,
  isValidConfigueGoogleRequest,
  isValidCreateNewHederaAccountParams,
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
  console.log(
    'request.params=========',
    JSON.stringify(request.params, null, 4),
  );

  let state = await getSnapStateUnchecked(snap);
  if (state === null) {
    state = await init(snap);
  }
  console.log('state:', JSON.stringify(state, null, 4));

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
    state,
    request.params,
    isExternalAccount,
  );
  account.extraData = extraData;

  console.log(`Current account: ${JSON.stringify(account, null, 4)}`);

  const identitySnapParams: IdentitySnapParams = {
    origin,
    snap,
    state,
    metamask: ethereum,
    account,
  };

  switch (request.method) {
    case 'hello': {
      return snap.request({
        method: 'snap_dialog',
        params: {
          /* 
            Type can be one of the following:
            - 'alert': for displaying information.
            - 'confirmation': for accepting or rejecting some action.
            - 'prompt': for inputting some information.
          */
          type: 'alert',
          content: await generateCommonPanel(origin, [
            heading('Hello from Identify Snap!'),
            text('This custom alert is just for display purposes.'),
          ]),
        },
      });
    }

    case 'togglePopups': {
      return await togglePopups(identitySnapParams);
    }

    case 'getAccountInfo': {
      return await getAccountInfo(identitySnapParams);
    }

    case 'createNewHederaAccount': {
      isValidCreateNewHederaAccountParams(request.params);
      return await createNewHederaAccount(
        identitySnapParams,
        request.params as CreateNewHederaAccountRequestParams,
      );
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

    case 'switchDIDMethod': {
      isValidSwitchMethodRequest(request.params);
      return await switchDIDMethod(
        identitySnapParams,
        request.params.didMethod,
      );
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

    default: {
      console.error('Method not found');
      throw new Error('Method not found');
    }
  }
};
