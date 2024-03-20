import { installSnap } from '@metamask/snaps-jest';

describe('MySnap', () => {
    it('should do something', async () => {
    const { request } = await installSnap();
    const response = await request({
      method: 'testingFunctionalTests',
      params: [],
    });

    expect(response).toBe('hi');
  });
});
