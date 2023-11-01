import { MetaMaskInpageProvider } from '@metamask/providers';

import { hederaNetworks, isIn } from '../types/constants';

/**
 * Get current network.
 *
 * @param metamask - Metamask provider.
 */
export async function getCurrentNetwork(
  metamask: MetaMaskInpageProvider,
): Promise<string> {
  return (await metamask.request({
    method: 'eth_chainId',
  })) as string;
}

export const validHederaNetwork = (network: string) => {
  return isIn(hederaNetworks, network);
};
