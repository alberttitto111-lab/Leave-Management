// client/webpack.config.js
// const createExpoWebpackConfigAsync = require("@expo/webpack-config");

// module.exports = async function (env, argv) {
//   const config = await createExpoWebpackConfigAsync(env, argv);

//   config.devServer = {
//     ...config.devServer,
//     proxy: {
//       "/uploads": "http://192.168.1.13:5000",
//     },
//   };

//   return config;
// };

// client/webpack.config.js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['react-native-vector-icons']
    }
  }, argv);
  
  // Add vector icons font loading
  config.module.rules.push({
    test: /\.ttf$/,
    loader: 'file-loader',
    include: /node_modules[\\/]react-native-vector-icons/,
  });

  return config;
};
