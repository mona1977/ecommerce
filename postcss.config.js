/**
 * PostCSS config to be used by postcss-loader on webpack
 */

function buildConfig (args) {
  let env = 'dev'
  if (args.env === 'production') {
    env = 'prod'
  }
  return require('./config/postcss.' + env + '.js')
}

module.exports = buildConfig
