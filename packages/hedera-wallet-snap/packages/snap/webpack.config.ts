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

import SnapsWebpackPlugin from '@metamask/snaps-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Configuration, ProvidePlugin } from 'webpack';
import { merge } from 'webpack-merge';
import WebpackBarPlugin from 'webpackbar';
// eslint-disable-next-line import/no-nodejs-modules
import * as path from 'path';

// Configuration that is shared between the two bundles
const common: Configuration = {
  // For simplicity, we don't do any optimisations here. Ideally, this would be
  // dependent on the `NODE_ENV` or script you're running.
  mode: 'none',
  devtool: 'source-map',
  stats: 'errors-only',
  output: {
    // eslint-disable-next-line no-restricted-globals
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: './dist',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      stream: false,
      // stream: require.resolve('stream-browserify'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(m?js|ts)x?$/u,
        resolve: {
          fullySpecified: false,
        },
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        ],
      },
      { test: /.json$/u, type: 'json' },
    ],
  },
  plugins: [
    new WebpackBarPlugin(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    new ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new ESLintPlugin({
      extensions: ['ts'],
    }),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
        configFile: 'tsconfig.build.json',
      },
    }),
  ],
  //  stats: "errors-only",
  watchOptions: {
    ignored: ['**/snap.manifest.json'],
  },
};

// Configuration for the Snap bundle
const snapConfig: Configuration = merge(common, {
  entry: {
    snap: './src/index.ts',
  },
  output: {
    // Required so that webpack doesn't mangle our `exports` variable
    libraryTarget: 'commonjs',
  },
  plugins: [new SnapsWebpackPlugin({ eval: false })],
});

const config = [snapConfig];
export default config;
