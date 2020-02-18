const base = require('./webpack.config.base');
const path = require('path');

module.exports = {
  ...base,
  mode: 'development',
  devtool: 'inline-source-map',

  devServer: {
    contentBase: path.join(__dirname, 'build'),
    compress: true,
    hot: true,
    host: '0.0.0.0',
  },
};
