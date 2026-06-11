// babel-preset-expo already wires the Reanimated/Worklets Babel plugin.
// Do NOT add react-native-reanimated/plugin or react-native-worklets/plugin manually.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
