const fs = require('fs')
const chalk = require('chalk')
const argv = require('minimist')(process.argv.slice(2))
const env = argv.env || 'prod'
const host = argv.host || '0.0.0.0'
const port = argv.port || 3000

/**
 * Handles the server creation
 * @param {Function} webpackDevMiddlewareInstance
 */
function createServer (webpackDevMiddlewareInstance) {
  // creates a new json-server
  const jsonServer = require('json-server')
  const server = jsonServer.create()

  // get default middlewares and require our owns
  const middlewares = jsonServer.defaults()
  const delayMiddleware = require('./src/server/handle-delay.js')
  const adsMiddleware = require('./src/server/handle-ads.js')

  // rewrite the routes
  const rewriter = jsonServer.rewriter(require('./src/server/routes.json'))

  // generate random data and give it to json-server
  const data = require('./src/server/index.js')()
  const router = jsonServer.router(data)

  // if it is not production use webpack-dev-middleware
  if (env !== 'prod' && webpackDevMiddlewareInstance) {
    server.use(webpackDevMiddlewareInstance)
  }
  // use default and our middlewares
  server.use(middlewares)
  server.use(delayMiddleware)
  server.use(adsMiddleware)
  // use our route rewriter and our data
  server.use(rewriter)
  server.use(router)
  // listen the server
  server.listen(port, host, () => {
    const serverUrl = 'http://' + (host === '0.0.0.0' ? 'localhost' : host) + ':' + port
    console.log()
    console.log('  ' + chalk.blue('\\{^_^}/ Welcome to the most famous e-commerce: ascii faces!'))
    console.log()
    console.log('  ' + chalk.bold('Check it out on your favorite browser:'))
    console.log('  ' + chalk.underline.green(serverUrl))
    console.log()
    console.log(chalk.gray('Processing requests..'))
  })
}

/**
 * Handles the webpack build
 */
function webpackBuild () {
  // try to acquire webpack module
  let webpack = null
  try {
    webpack = require('webpack')
  } catch (e) {
    // if it is not production you need to install developer dependencies to build
    if (env !== 'prod') {
      console.log()
      console.log('  ' + chalk.red('You need to install developer dependencies!'))
      console.log()
      return
    }

    // if it is production you need to have dist files
    if (!fs.existsSync('./public/js/bundle.js') || !fs.existsSync('./public/css/styles.css')) {
      console.log()
      console.log('  ' + chalk.red('You do not have distribution files! Try to build prior to run.'))
      console.log()
      return
    }

    // creates the server once it is production and everything is built
    createServer()
    return
  }

  // get webpack config and instantiate a new webpack compiler
  const webpackConfig = require('./webpack.config.js')(env)
  const webpackInstance = webpack(webpackConfig)

  // if it is production just run webpack build and then create the server
  if (env === 'prod') {
    webpackInstance.run(() => createServer())
    return
  }

  // it it is not production instantiate the webpack-dev-middleware and then create the server
  const webpackMiddleware = require('webpack-dev-middleware')
  const webpackMiddlewareOptions = {
    noInfo: true,
    stats: {
      colors: true
    }
  }
  const webpackDevMiddlewareInstance = webpackMiddleware(webpackInstance, webpackMiddlewareOptions)
  createServer(webpackDevMiddlewareInstance)
}

// start the build
webpackBuild()
