import { providerErrors } from '@metamask/rpc-errors';

import { getHederaClient } from '../services/impl/hedera';
import { SimpleHederaClient } from '../types/hedera';

export class HederaClientFactory {
  /**
   * Create Hedera Client to use for transactions.
   *
   * @param curve - Curve that was used to derive the keys('ECDSA_SECP256K1' | 'ED25519').
   * @param privateKey - Private key of the account.
   * @param hederaAccountId - Hedera Account ID.
   * @param network - Hedera network.
   */
  public static async create(
    curve: string,
    privateKey: string,
    hederaAccountId: string,
    network: string,
  ): Promise<SimpleHederaClient> {
    const hederaClient = await getHederaClient(
      curve,
      privateKey,
      hederaAccountId,
      network,
    );
    if (!hederaClient) {
      console.error(
        `Could not setup a Hedera client with '${hederaAccountId}' at this time. Please try again later.`,
      );
      throw providerErrors.custom({
        code: 4200,
        message: `Could not setup a Hedera client with ${hederaAccountId} on ${network} at this time. Please try again later.`,
        data: hederaAccountId,
      });
    }

    return hederaClient;
  }
}
