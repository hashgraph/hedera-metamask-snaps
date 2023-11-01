import _ from 'lodash';
import normalizeUrl from 'normalize-url';
import { ExternalAccount } from '../types/account';
import {
  GetAccountInfoRequestParams,
  MirrorNodeParams,
  TransferCryptoRequestParams,
} from '../types/params';

/**
 * Check Validation of MirrorNode flag.
 *
 * @param params - Request params.
 * @returns MirrornodeUrl.
 */
export function getMirrorNodeFlagIfExists(params: unknown): string {
  let mirrorNodeUrl = '';
  if (
    params !== null &&
    typeof params === 'object' &&
    'mirrorNodeUrl' in params
  ) {
    const parameter = params as MirrorNodeParams;

    if (
      parameter.mirrorNodeUrl === null ||
      typeof parameter.mirrorNodeUrl !== 'string'
    ) {
      console.error(
        'Invalid MirrorNode Params passed. "mirrorNodeUrl" must be a string',
      );
      throw new Error(
        'Invalid MirrorNode Params passed. "mirrorNodeUrl" must be a string',
      );
    }

    if (!_.isEmpty(parameter.mirrorNodeUrl)) {
      mirrorNodeUrl = normalizeUrl(parameter.mirrorNodeUrl);
    }
  }

  return mirrorNodeUrl;
}

/**
 * Check whether the the account was imported using private key(external account).
 *
 * @param params - Request params.
 * @returns Whether to treat it as an external account that was imported using private key.
 */
export function isExternalAccountFlagSet(params: unknown): boolean {
  if (
    params !== null &&
    typeof params === 'object' &&
    'externalAccount' in params &&
    params.externalAccount !== null &&
    typeof params.externalAccount === 'object'
  ) {
    const parameter = params as ExternalAccount;

    if ('accountIdOrEvmAddress' in parameter.externalAccount) {
      if (
        parameter.externalAccount.accountIdOrEvmAddress !== null &&
        typeof parameter.externalAccount.accountIdOrEvmAddress === 'string'
      ) {
        if (_.isEmpty(parameter.externalAccount.accountIdOrEvmAddress)) {
          console.error(
            'Invalid externalAccount Params passed. "accountIdOrEvmAddress" must not be empty',
          );
          throw new Error(
            'Invalid externalAccount Params passed. "accountIdOrEvmAddress" must not be empty',
          );
        }
        if (
          'curve' in parameter.externalAccount &&
          parameter.externalAccount.curve !== null
        ) {
          if (
            typeof parameter.externalAccount.curve !== 'string' ||
            (parameter.externalAccount.curve !== 'ECDSA_SECP256K1' &&
              parameter.externalAccount.curve !== 'ED25519')
          ) {
            console.error(
              'Invalid externalAccount Params passed. "curve" must be a string and must be either "ECDSA_SECP256K1" or "ED25519"',
            );
            throw new Error(
              'Invalid externalAccount Params passed. "curve" must be a string and must be either "ECDSA_SECP256K1" or "ED25519"',
            );
          }
        }
        return true;
      }
    }
  }
  return false;
}

/**
 * Check Validation of getAccountInfo request.
 *
 * @param params - Request params.
 */
export function isValidGetAccountInfoRequest(
  params: unknown,
): asserts params is GetAccountInfoRequestParams {
  const parameter = params as GetAccountInfoRequestParams;

  if (
    'accountId' in parameter &&
    (parameter.accountId === null || typeof parameter.accountId !== 'string')
  ) {
    console.error(
      'Invalid getAccountInfo Params passed. "accountId" must be a string',
    );
    throw new Error(
      'Invalid getAccountInfo Params passed. "accountId" must be a string',
    );
  }
}

/**
 * Check Validation of transferCrypto request.
 *
 * @param params - Request params.
 */
export function isValidTransferCryptoParams(
  params: unknown,
): asserts params is TransferCryptoRequestParams {
  if (params === null || _.isEmpty(params) || !('transfers' in params)) {
    console.error(
      'Invalid transferCrypto Params passed. "transfers" must be passed as a parameter',
    );
    throw new Error(
      'Invalid transferCrypto Params passed. "transfers" must be passed as a parameter',
    );
  }

  const parameter = params as TransferCryptoRequestParams;

  if (parameter.transfers) {
    parameter.transfers.forEach((transfer: object) => {
      if (
        !('asset' in transfer) ||
        typeof transfer.asset !== 'string' ||
        _.isEmpty(transfer.asset)
      ) {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].asset" is not a string or is empty`,
        );
        throw new Error(
          `Invalid transferCrypto Params passed. "transfers[].asset" is not a string or is empty`,
        );
      }
      if (
        !('to' in transfer) ||
        typeof transfer.to !== 'string' ||
        _.isEmpty(transfer.to)
      ) {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].to" is not a string or is empty`,
        );
        throw new Error(
          `Invalid transferCrypto Params passed. "transfers[].to" is not a string or is empty`,
        );
      }
      if (!('amount' in transfer) || typeof transfer.amount !== 'number') {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].amount" is not a number`,
        );
        throw new Error(
          `Invalid transferCrypto Params passed. "transfers[].to" is not a number`,
        );
      }
    });
  }

  // Check if memo is valid
  if ('memo' in parameter && typeof parameter.memo !== 'string') {
    console.error(
      `Invalid transferCrypto Params passed. "memo" is not a string`,
    );
    throw new Error(
      `Invalid transferCrypto Params passed. "memo" is not a string`,
    );
  }

  // Check if maxFee is valid
  if ('maxFee' in parameter && typeof parameter.maxFee !== 'number') {
    console.error(
      `Invalid transferCrypto Params passed. "maxFee" is not a number`,
    );
    throw new Error(
      `Invalid transferCrypto Params passed. "maxFee" is not a number`,
    );
  }
}
