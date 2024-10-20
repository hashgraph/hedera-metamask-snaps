/*-
 *
 * Hedera Identify Snap
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

import { CodecName, MULTICODECS } from '../constants';

/**
 * Prefix a buffer with a multicodec-packed.
 *
 * @param {CodecName} multicodec
 * @param {Uint8Array} data
 *
 * @returns {Uint8Array}
 */
export const addMulticodecPrefix = (
  multicodec: CodecName,
  data: Uint8Array,
): Uint8Array => {
  let prefix;

  if (MULTICODECS[multicodec]) {
    prefix = Buffer.from(MULTICODECS[multicodec]);
  } else {
    throw new Error('multicodec not recognized');
  }

  return Buffer.concat([prefix, data], prefix.length + data.length);
};
