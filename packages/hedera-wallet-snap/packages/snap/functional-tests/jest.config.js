module.exports = {
  preset: '@metamask/snaps-jest',
  testEnvironmentOptions: {
    server: {
      root: '../',
    },
  },
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
};
