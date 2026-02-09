// client/webpack.config.js
const createExpoWebpackConfigAsync = require("@expo/webpack-config");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.devServer = {
    ...config.devServer,
    proxy: {
      "/uploads": "http://192.168.1.13:5000",
    },
  };

  return config;
};
