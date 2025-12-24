const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [
    // Watch the parent directory to resolve the local SDK package
    path.resolve(__dirname, '..'),
  ],
  resolver: {
    // Block the parent SDK's node_modules to prevent duplicate React Native
    blockList: [
      // Ignore react-native in parent node_modules
      new RegExp(`${path.resolve(__dirname, '..')}/node_modules/react-native/.*`.replace(/\\/g, '\\\\')),
      new RegExp(`${path.resolve(__dirname, '..')}/node_modules/react/.*`.replace(/\\/g, '\\\\')),
      new RegExp(`${path.resolve(__dirname, '..')}/node_modules/@react-native/.*`.replace(/\\/g, '\\\\')),
    ],
    // Ensure Metro resolves the local package correctly
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
    ],
    // Explicitly use react-native from the example's node_modules ONLY
    extraNodeModules: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
      'react': path.resolve(__dirname, 'node_modules/react'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
