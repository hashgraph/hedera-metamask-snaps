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
      const expected = new Date(parseInt(timestamp) * 1000).toUTCString();
      expect(Utils.timestampToString(timestamp)).toBe(expected);
    });

    test('should return an empty string for non-numeric string input', () => {
      expect(Utils.timestampToString('invalid')).toBe('Invalid Date');
    });
  });
});
