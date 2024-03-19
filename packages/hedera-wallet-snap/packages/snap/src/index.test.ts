import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';
import { panel, text } from '@metamask/snaps-sdk';

describe('onRpcRequest', () => {
  describe('hello', () => {
    it('shows a confirmation dialog', async () => {
      const { request } = await installSnap();

      const origin = 'Jest';
      const response = request({
        method: 'hello',
        origin,
      });

      const ui = await response.getInterface();
      expect(ui.type).toBe('confirmation');
      expect(ui).toRender(
        panel([
          text(`Hello, **${origin}**!`),
          text(
            "You are seeing this because you interacted with the 'hello' method",
          ),
        ]),
      );

      await ui.ok();

      expect(await response).toRespondWith(true);
    });
  });

  it('throws an error if the requested method does not exist', async () => {
    const { request } = await installSnap();

    const response = await request({
      method: 'foo',
    });

    expect(response).toRespondWithError({
      code: -32603,
      message: 'Method not found.',
      stack: expect.any(String),
    });
  });
});
