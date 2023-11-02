// @type {import('@babel/core').ConfigFunction}
/* eslint-disable */
module.exports = (api) => {
  // Cache configuration is a required option
  api.cache(false);

  const presets = [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ];
  // Plugins needed for class validator tests
  const plugins = [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-transform-flow-strip-types'],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-syntax-import-assertions'],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
  ];

  return { presets, plugins };
};
