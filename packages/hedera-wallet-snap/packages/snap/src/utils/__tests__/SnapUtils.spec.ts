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
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-shadow */
import { SnapUtils } from '../SnapUtils';
import { text, heading } from '@metamask/snaps-ui';

jest.mock('@metamask/snaps-ui', () => ({
  text: jest.fn().mockImplementation((text) => `text-${text}`),
  divider: jest.fn().mockImplementation(() => 'divider'),
  heading: jest.fn().mockImplementation((heading) => `heading-${heading}`),
  panel: jest.fn().mockImplementation((content) => ({ content })),
}));

describe('SnapUtils', () => {
  describe('generateCommonPanel', () => {
    it('should generate a common panel with provided origin and prompt', async () => {
      const origin = 'testOrigin';
      const prompts = [heading('Test Heading'), text('Test Text')];

      const result = await SnapUtils.generateCommonPanel(origin, prompts);

      expect(result).toEqual({
        content: [
          'text-Origin: testOrigin',
          'divider',
          'heading-Test Heading',
          'text-Test Text',
        ],
      });
    });
  });
});
