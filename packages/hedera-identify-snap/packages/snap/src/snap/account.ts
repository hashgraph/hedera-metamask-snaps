import { AccountId, PrivateKey } from '@hashgraph/sdk';
import { divider, heading, text } from '@metamask/snaps-ui';
import { Wallet, ethers } from 'ethers';
import _ from 'lodash';
import { validHederaChainID } from '../hedera/config';
import {
  Account,
  AccountViaPrivateKey,
  EvmAccountParams,
  ExternalAccount,
  HederaAccountParams,
  IdentitySnapState,
  MetamaskAccountParams,
  SnapDialogParams,
} from '../interfaces';
import { DEFAULTCOINTYPE, HEDERACOINTYPE } from '../types/constants';
import { getHederaAccountIfExists } from '../utils/params';
import { veramoImportMetaMaskAccount } from '../veramo/accountImport';
import { generateCommonPanel, snapDialog } from './dialog';
import { getCurrentNetwork } from './network';
import { getCurrentCoinType, initAccountState } from './state';

/**
 * Function that returns account info of the currently selected MetaMask account.
 *
 * @param state - IdentitySnapState.
 * @param params - Parameters passed.
 * @param isExternalAccount - Whether this is a metamask or a non-metamask account.
 * @returns MetaMask address and did.
 */
export async function getCurrentAccount(
  state: IdentitySnapState,
  params: unknown,
  isExternalAccount: boolean,
): Promise<Account> {
  try {
    // Handle external account(non-metamask account)
    if (isExternalAccount) {
      const nonMetamaskAccount = params as ExternalAccount;
      if (nonMetamaskAccount.externalAccount) {
        if (nonMetamaskAccount.externalAccount.blockchainType === 'hedera') {
          const hederaAccountId = (
            nonMetamaskAccount.externalAccount.data as HederaAccountParams
          ).accountId;
          if (!AccountId.fromString(hederaAccountId)) {
            console.error(
              `Invalid Hedera Account Id '${hederaAccountId}' is not a valid account Id`,
            );
            throw new Error(
              `Invalid Hedera Account Id '${hederaAccountId}' is not a valid account Id`,
            );
          }
          return await connectHederaAccount(state, hederaAccountId);
        } else if (
          nonMetamaskAccount.externalAccount.blockchainType === 'evm'
        ) {
          const ethAddress = (
            nonMetamaskAccount.externalAccount.data as EvmAccountParams
          ).address.toLowerCase();
          if (!ethers.isAddress(ethAddress)) {
            console.error(
              `Invalid EVM Account Address '${ethAddress}' is not a valid address`,
            );
            throw new Error(
              `Invalid EVM Account Address '${ethAddress}' is not a valid address`,
            );
          }
          return await connectEVMAccount(state, ethAddress);
        }

        console.error(
          `Invalid blockchainType '${nonMetamaskAccount.externalAccount.blockchainType}'. The valid blockchain types are ['hedera', 'evm']`,
        );
        throw new Error(
          `Invalid blockchainType '${nonMetamaskAccount.externalAccount.blockchainType}'. The valid blockchain types are ['hedera', 'evm']`,
        );
      }
    }

    // Handle metamask account
    const { metamaskAddress } = params as MetamaskAccountParams;
    if (!ethers.isAddress(metamaskAddress)) {
      console.error(
        `Invalid Account Address '${metamaskAddress}' is not a valid address`,
      );
      throw new Error(
        `Invalid Account Address '${metamaskAddress}' is not a valid address`,
      );
    }

    // Initialize if not there
    const coinType = (await getCurrentCoinType()).toString();
    if (metamaskAddress && !(metamaskAddress in state.accountState[coinType])) {
      console.log(
        `The address ${metamaskAddress} has NOT yet been configured in the Identify Snap. Configuring now...`,
      );
      await initAccountState(snap, state, coinType, metamaskAddress);
    }
    return await veramoImportMetaMaskAccount(
      snap,
      state,
      ethereum,
      metamaskAddress,
    );
  } catch (e) {
    console.error(`Error while trying to get the account: ${e}`);
    throw new Error(`Error while trying to get the account: ${e}`);
  }
}

/**
 * Connect EVM Account.
 *
 * @param state - Identity state.
 * @param evmAddress - EVM Account address.
 */
async function connectEVMAccount(
  state: IdentitySnapState,
  evmAddress: string,
): Promise<Account> {
  let accountExists = false;
  for (const address of Object.keys(state.accountState[DEFAULTCOINTYPE])) {
    if (evmAddress === address) {
      accountExists = true;
      break;
    }
  }

  let privateKey: string;
  if (accountExists) {
    const controllerKeyId = `metamask-${evmAddress}`;
    privateKey =
      state.accountState[DEFAULTCOINTYPE][evmAddress].snapPrivateKeyStore[
        controllerKeyId
      ].privateKeyHex;
  } else {
    const dialogParamsForPrivateKey: SnapDialogParams = {
      type: 'prompt',
      content: await generateCommonPanel(origin, [
        heading('Connect to EVM Account'),
        text('Enter your ECDSA private key for the following Account'),
        divider(),
        text(`EVM Address: ${evmAddress}`),
      ]),
      placeholder: '2386d1d21644dc65d...', // You can use '2386d1d21644dc65d4e4b9e2242c5f155cab174916cbc46ad85622cdaeac835c' for testing purposes
    };
    privateKey = PrivateKey.fromString(
      (await snapDialog(snap, dialogParamsForPrivateKey)) as string,
    ).toStringRaw();
  }

  const wallet: Wallet = new ethers.Wallet(privateKey);
  const accountViaPrivateKey: AccountViaPrivateKey = {
    privateKey,
    publicKey: wallet.signingKey.publicKey,
    address: wallet.address,
  };

  return await veramoImportMetaMaskAccount(
    snap,
    state,
    ethereum,
    '',
    accountViaPrivateKey,
  );
}

/**
 * Connect Hedera Account.
 *
 * @param state - Identity state.
 * @param accountId - Account id.
 */
async function connectHederaAccount(
  state: IdentitySnapState,
  accountId: string,
): Promise<Account> {
  const chainId = await getCurrentNetwork(ethereum);
  if (!validHederaChainID(chainId)) {
    console.error(
      'Invalid Chain ID. Valid chainIDs for Hedera: [0x127: mainnet, 0x128: testnet, 0x129: previewnet]',
    );
    throw new Error(
      'Non-Hedera network was selected on Metamask while trying to configure the Hedera network. Please switch the network to Hedera Network first',
    );
  }

  let privateKey: string;
  const evmAddress = await getHederaAccountIfExists(
    state,
    accountId,
    undefined,
  );
  if (evmAddress === null || _.isEmpty(evmAddress)) {
    const dialogParamsForPrivateKey: SnapDialogParams = {
      type: 'prompt',
      content: await generateCommonPanel(origin, [
        heading('Connect to Hedera Account'),
        text('Enter your ECDSA private key for the following Account'),
        divider(),
        text(`Account Id: ${accountId}`),
      ]),
      placeholder: '2386d1d21644dc65d...', // You can use '2386d1d21644dc65d4e4b9e2242c5f155cab174916cbc46ad85622cdaeac835c' and '0.0.15215' for testing purposes
    };
    privateKey = PrivateKey.fromString(
      (await snapDialog(snap, dialogParamsForPrivateKey)) as string,
    ).toStringRaw();
  } else {
    const controllerKeyId = `metamask-${evmAddress}`;
    privateKey =
      state.accountState[HEDERACOINTYPE][evmAddress].snapPrivateKeyStore[
        controllerKeyId
      ].privateKeyHex;
  }

  const wallet: Wallet = new ethers.Wallet(privateKey);
  const accountViaPrivateKey: AccountViaPrivateKey = {
    privateKey,
    publicKey: wallet.signingKey.publicKey,
    address: wallet.address,
    extraData: accountId,
  };

  return await veramoImportMetaMaskAccount(
    snap,
    state,
    ethereum,
    '',
    accountViaPrivateKey,
  );
}
