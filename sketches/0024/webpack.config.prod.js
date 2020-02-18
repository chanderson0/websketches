const base = require('./webpack.config.base');

module.exports = {
  ...base,
  mode: 'production',
  devtool: 'source-map',
}