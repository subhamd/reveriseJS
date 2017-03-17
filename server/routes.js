import cors from 'cors'
import bodyParser from 'body-parser'
import db from './db'
import accountFactory from './models/account'
import strManagerFactory from './models/strManager'

export default function makeRoutes(app) {

  app.use(cors())
  app.use(bodyParser.json())

  let account = accountFactory(),
      strManager = strManagerFactory()

  // get routes
  app.get('/', (req, res) => {
    res.end('JS Localizer backend!')
  })

  // return approved dictionary
  app.get('/fetch', (req, res) => {

  })

  // post routes

  // accepts strings returns dictionary
  app.post('/submit', (req, res) => {
    // get the apikey
    let apikey = req.headers['rev-api-key']
    let appid = req.headers['rev-app-id']

    //create/update account and sync dictionary
    account.createAccount(apikey, appid)
    .then(result => {
      strManager.syncDictionary(apikey, appid, req.body).then((r) => {
        strManager.getStringData(apikey, appid, req.body.dict_key)
        .then(dictionary => {
          res.json({ success: true, msg: 'Successfully received strings.', dictionary })
        })
      })
    .catch(err => {
        console.log(err)
        res.json({ success: false, msg: 'Loading strings failed' })
      })
    })

  })


  // put routes
  app.put('/string', (req, res) => {

  })

}
