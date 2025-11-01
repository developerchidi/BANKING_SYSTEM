const { getDefaultConfig } = require('expo/metro-config');

// Get the default Metro config from Expo
const config = getDefaultConfig(__dirname);

// Add web support
config.resolver.alias = {
  'react-native': 'react-native-web',
  'react-native-web': 'react-native-web',
};

config.resolver.platforms = ['web', 'ios', 'android', 'native'];

// Add web extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.js',
  'web.jsx',
  'web.ts',
  'web.tsx',
];

module.exports = config; 