import type { Snap } from '@metamask/snaps-jest';
import { installSnap } from '@metamask/snaps-jest';
import { expect } from '@jest/globals';
import { panel, text } from '@metamask/snaps-sdk';

describe('Hedera Wallet Snap', () => {
  it('Should return a valid Snap object', async () => {
    const snapObj: Snap = await installSnap();
    expect(snapObj).toHaveProperty('request');
  });

  it('Should return a confirmation dialog for the Hello RPC method', async () => {
    const snapObj: Snap = await installSnap();
    const origin = 'Jest';
    const response = snapObj.request({
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

  it('Should throw an error when an invalid method is specified', async () => {
    const snap = await installSnap();
    const request = snap.request.bind(snap);

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
