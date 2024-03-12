/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

export type FetchResponse = {
  success: boolean;
  data: any;
  error: string | undefined;
};

/**
 * Provides utilities for interacting with Hedera Wallet Snap functionalities.
 */
export class FetchUtils {
  /**
   * Retrieve results using hedera mirror node.
   *
   * @param url - The URL to use to query.
   * @returns A promise that resolves to the fetch response.
   */
  public static async fetchDataFromUrl(
    url: RequestInfo | URL,
  ): Promise<FetchResponse> {
    let data;
    let error;

    const response = await fetch(url);

    if (response.ok) {
      data = await response.json();
    } else {
      error = `Network response was not ok. Status: ${response.status} ${response.statusText}`;
    }

    return {
      success: response.ok,
      data,
      error,
    };
  }
}
