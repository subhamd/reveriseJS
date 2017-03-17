import express from 'express'
import config from './config'
import makeRoutes from './routes'
import db from './db'

// create app instance
let app = express()

// configure routes
makeRoutes(app)

// start the server
app.listen(config.port, function() {
  console.log(`Application listening on port ${config.port}.`)
})
