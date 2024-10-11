import { AccountId, PrivateKey, PublicKey } from '@hashgraph/sdk';
import { BigNumber } from 'bignumber.js';
import _ from 'lodash';
import { HederaServiceImpl, isValidHederaAccountInfo } from '../../hedera';
import { getHederaNetwork, validHederaChainID } from '../../hedera/config';
import { HederaMirrorInfo, SimpleHederaClient } from '../../hedera/service';
import { WalletHedera } from '../../hedera/wallet/abstract';
import { PrivateKeySoftwareWallet } from '../../hedera/wallet/software-private-key';
import { HederaAccountParams, IdentitySnapParams } from '../../interfaces';
import { getCurrentNetwork } from '../../snap/network';
import { CreateNewHederaAccountRequestParams } from '../../types/params';
import { getHederaAccountIfExists } from '../../utils/params';

/**
 * Function to create a new hedera account.
 *
 * @param identitySnapParams - Identity snap params.
 * @param newHederaAccountParams - Parameters for creating a new hedera account.
 */
export async function createNewHederaAccount(
  identitySnapParams: IdentitySnapParams,
  newHederaAccountParams: CreateNewHederaAccountRequestParams,
): Promise<HederaMirrorInfo> {
  const { state, account } = identitySnapParams;
  const {
    hbarAmountToSend,
    newAccountPublickey = '',
    newAccountEvmAddress = '',
  } = newHederaAccountParams;

  const chainId = await getCurrentNetwork(ethereum);
  if (!validHederaChainID(chainId)) {
    console.error(
      'Invalid Chain ID. Valid chainIDs for Hedera: [0x127: mainnet, 0x128: testnet, 0x129: previewnet]',
    );
    throw new Error(
      'Non-Hedera network was selected on Metamask while trying to configure the Hedera network. Please switch the network to Hedera Network first',
    );
  }

  let _accountId = '';
  if (account.extraData === null || _.isEmpty(account.extraData)) {
    _accountId = await getHederaAccountIfExists(
      state,
      undefined,
      account.evmAddress,
    );
  } else {
    _accountId = (account.extraData as HederaAccountParams).accountId;
  }

  const network = getHederaNetwork(chainId);
  if (
    !(await isValidHederaAccountInfo(account.evmAddress, _accountId, network))
  ) {
    console.error(
      `Could not retrieve hedera account info using the accountId '${_accountId} and evm address '${account.evmAddress}'`,
    );
    throw new Error(
      `Could not retrieve hedera account info using the accountId '${_accountId} and evm address '${account.evmAddress}'`,
    );
  }

  const hederaService = new HederaServiceImpl(network);
  const accountId = AccountId.fromString(_accountId);
  const privateKey = PrivateKey.fromStringECDSA(account.privateKey);
  const walletHedera: WalletHedera = new PrivateKeySoftwareWallet(privateKey);
  const hederaClient = (await hederaService.createClient({
    walletHedera,
    keyIndex: 0,
    accountId,
  })) as SimpleHederaClient;
  if (hederaClient === null || _.isEmpty(hederaClient)) {
    console.error('Invalid private key or account Id of the operator');
    throw new Error('Invalid private key or account Id of the operator');
  }

  let newAccount = false;
  let result;
  if (newAccountPublickey) {
    const publicKey = PublicKey.fromString(newAccountPublickey).toStringRaw();
    try {
      result = (await hederaService.getAccountFromPublicKey(
        publicKey,
      )) as HederaMirrorInfo;

      if (result === null || _.isEmpty(result)) {
        newAccount = true;
      }
    } catch (error) {
      console.log(
        'Error while retrieving account info using public key from the mirror node so let us just try to fund this account. Error: ',
        error,
      );
      newAccount = true;
    }

    if (newAccount) {
      result = (await hederaClient.createAccountForPublicKey({
        publicKey: PublicKey.fromString(publicKey),
        initialBalance: BigNumber(hbarAmountToSend),
      })) as HederaMirrorInfo;
    }
  } else {
    try {
      result = (await hederaService.getAccountFromEvmAddres(
        newAccountEvmAddress,
      )) as HederaMirrorInfo;

      if (result === null || _.isEmpty(result)) {
        newAccount = true;
      }
    } catch (error) {
      console.log(
        'Error while retrieving account info using evm address from the mirror node so let us just try to fund this account. Error: ',
        error,
      );
      newAccount = true;
    }

    if (newAccount) {
      result = (await hederaClient.createAccountForEvmAddress({
        evmAddress: newAccountEvmAddress,
        initialBalance: BigNumber(hbarAmountToSend),
      })) as HederaMirrorInfo;
    }
  }

  console.log(
    'Newly created Hedera Account info: ',
    JSON.stringify(result, null, 4),
  );

  if (result === null || _.isEmpty(result)) {
    console.error(
      'Could not create a new hedera account id for the given public key or evm address. Please try again',
    );
    throw new Error(
      'Could not create a new hedera account id for the given public key or evm address. Please try again',
    );
  }
  result.newlyCreated = newAccount;

  return result;
}
