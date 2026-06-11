// Standalone Expo app (not an npm workspace, to keep node_modules consistent).
// @nabdh/shared is a local copy under src/shared.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@nabdh/shared': path.resolve(__dirname, 'src/shared'),
};

module.exports = config;
