const appJson = require('./app.json');
const { expoBaseUrlFromEnv } = require('./scripts/lib/base-path.cjs');

const expo = appJson.expo;

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...expo,
    experiments: {
      ...expo.experiments,
      baseUrl: expoBaseUrlFromEnv(),
    },
  },
};
