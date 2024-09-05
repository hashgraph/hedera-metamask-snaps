import { MetaMaskInpageProvider } from '@metamask/providers';

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
