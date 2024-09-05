import { getAvailableDIDMethods } from '../../../src/rpc/did/getAvailableDIDMethods';

describe('GetAvailableMethods', () => {
  it('should return all available methods', async () => {
    // get
    const getAvailableMethodsResult = await getAvailableDIDMethods();
    expect(getAvailableMethodsResult.length).toBeGreaterThanOrEqual(1);

    expect.assertions(1);
  });

  it('should contains did:pkh in available methods', async () => {
    // get
    const getAvailableMethodsResult = await getAvailableDIDMethods();
    expect(getAvailableMethodsResult).toContain('did:pkh');

    expect.assertions(1);
  });
});
