import { SnapState } from '../SnapState';

jest.mock('../../utils/StateUtils', () => ({
  getInitialSnapState: jest.fn(),
}));

jest.mock('../../utils/HederaUtils', () => ({
  getMirrorNodeFlagIfExists: jest.fn(),
}));

describe('getCurrentNetwork', () => {
  it('should request and return the current network chain ID', async () => {
    const mockMetamaskProvider = {
      request: jest.fn().mockResolvedValue('0x1'), // Example chain ID for Ethereum Mainnet
    };
    // @ts-expect-error: likely related to transpilation issues, will fix in that work
    const network = await SnapState.getCurrentNetwork(mockMetamaskProvider);
    expect(network).toBe('0x1');
    expect(mockMetamaskProvider.request).toHaveBeenCalledWith({
      method: 'eth_chainId',
    });
  });
});
