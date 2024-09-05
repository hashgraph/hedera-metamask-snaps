import SnapsWebpackPlugin from '@metamask/snaps-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { resolve } from 'path';
import { Configuration, ProvidePlugin } from 'webpack';
import { merge } from 'webpack-merge';
import WebpackBarPlugin from 'webpackbar';
// Configuration that is shared between the two bundles
const common: Configuration = {
  // For simplicity, we don't do any optimisations here. Ideally, this would be
  // dependent on the `NODE_ENV` or script you're running.
  mode: 'none',
  devtool: 'source-map',
  stats: 'errors-only',
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: './dist',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      stream: false,
      assert: require.resolve('assert'),
      buffer: require.resolve('buffer'),
      console: require.resolve('console-browserify'),
      constants: require.resolve('constants-browserify'),
      crypto: require.resolve('crypto-browserify'),
      domain: require.resolve('domain-browser'),
      events: require.resolve('events'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      punycode: require.resolve('punycode'),
      process: require.resolve('process/browser'),
      querystring: require.resolve('querystring-es3'),
      // stream: require.resolve('stream-browserify'),
      string_decoder: require.resolve('string_decoder'),
      sys: require.resolve('util'),
      timers: require.resolve('timers-browserify'),
      tty: require.resolve('tty-browserify'),
      url: require.resolve('url'),
      util: require.resolve('util'),
      vm: require.resolve('vm-browserify'),
      zlib: require.resolve('browserify-zlib'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(m?js|ts)x?$/u,
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
