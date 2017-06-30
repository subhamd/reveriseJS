import express from 'express'
import config from './config'
import makeRoutes from './routes'


// create app instance
let app = express()

//app.use('/jobs', kue.app)

// configure routes
makeRoutes(app)

// start the server
app.listen(config.port, function() {
  console.log(`Application listening on port ${config.port}.`)
})



