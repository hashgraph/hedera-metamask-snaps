import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { IIdentifier, MinimalImportableKey } from '@veramo/core';
import { isValidHederaAccountInfo } from '../hedera';
import { getHederaNetwork, validHederaChainID } from '../hedera/config';
import {
  Account,
  AccountViaPrivateKey,
  IdentitySnapState,
} from '../interfaces';
import { requestHederaAccountId } from '../snap/dialog';
import { getCurrentNetwork } from '../snap/network';
import {
  getAccountStateByCoinType,
  getCurrentCoinType,
  initAccountState,
  updateSnapState,
} from '../snap/state';
import { generateWallet } from '../utils/keyPair';
import { convertChainIdFromHex } from '../utils/network';
import { getHederaAccountIfExists } from '../utils/params';
import { getVeramoAgent } from './agent';

const getCurrentMetamaskAccount = async (
  metamask: MetaMaskInpageProvider,
): Promise<string> => {
  const accounts = (await metamask.request({
    method: 'eth_requestAccounts',
  })) as string[];
  return accounts[0];
};

/**
 * Veramo Import metamask account.
 *
 * @param snap - SnapsGlobalObject.
 * @param state - IdentitySnapState.
 * @param metamask - MetaMaskInpageProvider.
 * @param evmAddress - Ethereum address.
 * @param accountViaPrivateKey - Account info if imported via private key directly(only used for Hedera accounts currently).
 * @returns Account.
 */
export async function veramoImportMetaMaskAccount(
  snap: SnapsGlobalObject,
  state: IdentitySnapState,
  metamask: MetaMaskInpageProvider,
  evmAddress: string,
  accountViaPrivateKey?: AccountViaPrivateKey,
): Promise<Account> {
  const chainId = await getCurrentNetwork(metamask);

  let privateKey: string;
  let publicKey: string;
  let address: string = evmAddress.toLowerCase();
  let addressToUseForDid = '';
  let hederaAccountId = '';

  if (accountViaPrivateKey) {
    privateKey = accountViaPrivateKey.privateKey;
    publicKey = accountViaPrivateKey.publicKey;
    address = accountViaPrivateKey.address.toLowerCase();
    addressToUseForDid = address;
    if (validHederaChainID(chainId)) {
      hederaAccountId = accountViaPrivateKey.extraData as string;
    }
  } else {
    // Verify if the user is connected to the correct wallet
    const connectedAddress = await getCurrentMetamaskAccount(metamask);
    if (address !== connectedAddress) {
      console.log(
        `Please connect to the account '${address}' via Metamask first`,
      );
      throw new Error(
        `Please connect to the account '${address}' via Metamask first`,
      );
    }

    const res = await generateWallet(address);

    if (!res) {
      console.log('Failed to generate snap wallet for DID operations');
      throw new Error('Failed to generate snap wallet for DID operations');
    }
    privateKey = res.privateKey.split('0x')[1];
    publicKey = res.publicKey;
    addressToUseForDid = res.address.toLowerCase();

    if (validHederaChainID(chainId)) {
      hederaAccountId = await getHederaAccountIfExists(
        state,
        undefined,
        address,
      );

      if (!hederaAccountId) {
        hederaAccountId = await requestHederaAccountId(snap);
      }
    }
  }

  // Initialize if not there
  const coinType = (await getCurrentCoinType()).toString();
  if (address && !(address in state.accountState[coinType])) {
    console.log(
      `The address ${address} has NOT yet been configured in the Identify Snap. Configuring now...`,
    );
    await initAccountState(snap, state, coinType, address);
  }

  if (validHederaChainID(chainId)) {
    if (
      !(await isValidHederaAccountInfo(
        address,
        hederaAccountId,
        getHederaNetwork(chainId),
      ))
    ) {
      console.error(
        `Could not retrieve hedera account info using the accountId '${hederaAccountId}'`,
      );
      throw new Error(
        `Could not retrieve hedera account info using the accountId '${hederaAccountId}'`,
      );
    }

    // eslint-disable-next-line
    state.accountState[coinType][address].extraData = hederaAccountId;
  }

  const accountState = await getAccountStateByCoinType(state, address);
  const method = accountState.accountConfig.identity.didMethod;

  let did = '';
  if (method === 'did:pkh') {
    did = `did:pkh:eip155:${convertChainIdFromHex(
      chainId,
    )}:${addressToUseForDid}`;
  }

  if (!did) {
    console.log('Failed to generate DID');
    throw new Error('Failed to generate DID');
  }

  // eslint-disable-next-line
  state.currentAccount.evmAddress = address;
  state.currentAccount.addrToUseForDid = addressToUseForDid;

  // Get Veramo agent
  const agent = await getVeramoAgent(snap, state);
  const controllerKeyId = `metamask-${address}`;
  console.log(
    `Importing using did=${did}, provider=${method}, controllerKeyId=${controllerKeyId}...`,
  );

  let identifier: IIdentifier;
  // Get identifier if it exists
  console.log('did: ', did);
  try {
    identifier = await agent.didManagerGet({
      did,
    });
  } catch (error) {
    try {
      identifier = await agent.didManagerImport({
        did,
        provider: method,
        controllerKeyId,
        keys: [
          {
            kid: controllerKeyId,
            type: 'Secp256k1',
            kms: 'snap',
            privateKeyHex: privateKey,
            publicKeyHex: publicKey,
          } as MinimalImportableKey,
        ],
      });
    } catch (e) {
      console.log(`Error while creating identifier: ${(e as Error).message}`);
      throw new Error(
        `Error while creating identifier: ${(e as Error).message}`,
      );
    }
  }
  await updateSnapState(snap, state);
  console.log('Identifier imported successfully: ', identifier);

  return {
    evmAddress: address,
    addrToUseForDid: addressToUseForDid,
    method,
    identifier,
    privateKey,
  } as Account;
}
