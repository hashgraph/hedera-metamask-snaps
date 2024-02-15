import { FetchUtils, FetchResponse } from '../FetchUtils';

global.fetch = jest.fn();

describe('FetchUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches data successfully from a URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ key: 'value' }),
      status: 200,
      statusText: 'OK',
    });

    const url = 'https://test.mirror.node/api/v1/accounts';
    const expected: FetchResponse = {
      success: true,
      data: { key: 'value' },
      error: undefined,
    };

    const result = await FetchUtils.fetchDataFromUrl(url);

    expect(global.fetch).toHaveBeenCalledWith(url);
    expect(result).toEqual(expected);
  });

  it('handles fetch error from a URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const url = 'https://test.mirror.node/api/v1/accounts/invalid';
    const expected: FetchResponse = {
      success: false,
      data: undefined,
      error: 'Network response was not ok. Status: 404 Not Found',
    };

    const result = await FetchUtils.fetchDataFromUrl(url);

    expect(global.fetch).toHaveBeenCalledWith(url);
    expect(result).toEqual(expected);
  });
});
