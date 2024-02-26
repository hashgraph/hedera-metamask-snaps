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

import { Utils } from '../Utils';

describe('HederaWalletSnap', () => {
  describe('timestampToString method', () => {
    test('should return an empty string for null input', () => {
      expect(Utils.timestampToString(null)).toBe('');
    });

    test('should return an empty string for undefined input', () => {
      expect(Utils.timestampToString(undefined)).toBe('');
    });

    test('should convert a Date object to a UTC string', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const expected = date.toUTCString();
      expect(Utils.timestampToString(date)).toBe(expected);
    });

    test('should convert a numeric timestamp to a UTC string', () => {
      const timestamp = 1672444800; // Equivalent to 2023-01-01T00:00:00Z
      const expected = new Date(timestamp * 1000).toUTCString();
      expect(Utils.timestampToString(timestamp)).toBe(expected);
    });

    test('should convert a string representation of a timestamp to a UTC string', () => {
      const timestamp = '1672444800'; // Equivalent to 2023-01-01T00:00:00Z
      const expected = new Date(parseInt(timestamp, 10) * 1000).toUTCString();
      expect(Utils.timestampToString(timestamp)).toBe(expected);
    });

    test('should return an empty string for non-numeric string input', () => {
      expect(Utils.timestampToString('invalid')).toBe('Invalid Date');
    });
  });
});
