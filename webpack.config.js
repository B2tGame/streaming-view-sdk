var path = require('path');

module.exports = {
  mode: 'production',
  entry: './index.js',
  output: {
    path: path.resolve('build'),
    filename: 'index.js',
    library: 'streaming-view-sdk',
    libraryTarget: 'umd',
  },
  optimization: {
    // Set this to false during debuging time..
    minimize: true,
    usedExports: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        // exclude: [/(node_modules)/],
        loader: 'babel-loader',
        options: {
          configFile: './babel.config.js',
        },
      },
    ],
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
  },
};
