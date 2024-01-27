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

export const timestampToString = (
  data: string | number | Date | null | undefined,
): string => {
  if (!data) {
    return '';
  }

  // If data is a Date object, convert it to a Unix timestamp (in seconds)
  let timestamp: number;
  if (data instanceof Date) {
    timestamp = data.getTime() / 1000;
  } else if (typeof data === 'string' || typeof data === 'number') {
    // If data is a string or number, parse it to a float (assuming it's a Unix timestamp in seconds)
    timestamp = parseFloat(data.toString());
  } else {
    // If data is of an unexpected type, return an empty string
    return '';
  }

  // Convert the Unix timestamp to a UTC string
  return new Date(timestamp * 1000).toUTCString();
};
