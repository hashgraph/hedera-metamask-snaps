/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2023 Tuum Tech
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/* eslint-disable no-restricted-globals */
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
