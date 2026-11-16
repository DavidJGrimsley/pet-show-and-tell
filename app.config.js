const { expoBaseUrlFromEnv } = require('./scripts/lib/base-path.cjs');

/** @type {(context: import('expo/config').ConfigContext) => import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: expoBaseUrlFromEnv(),
  },
});
