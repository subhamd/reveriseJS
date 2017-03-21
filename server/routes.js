import cors from 'cors'
import bodyParser from 'body-parser'
import dbc from './db'
import accountFactory from './models/account'
import strManagerFactory from './models/strManager'
import { objForEach } from './utils'

export default function makeRoutes(app) {

  app.use(cors())
  app.use(bodyParser.json({limit: '50mb'}))

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
  app.post('/update-check', (req, res) => {
    // check for update and if available send back the new data
    let apikey = req.headers['rev-api-key'],
        appid = req.headers['rev-app-id'],
        __appid = appid.replace('.', '~')

    let { dict_key, timestamp } = req.body
    dbc.connect().then(db => {
      return db.collection(apikey).findOne()
    })
    .then(doc => {
      let last_updated = doc.apps[__appid].dictionary[dict_key].__meta__.lastUpdated
      if(last_updated > timestamp) {
        let dict = doc.apps[__appid].dictionary[dict_key],
            updatedOn = dict.__meta__.lastUpdated,
            published = {}

        objForEach(dict.entries, (entry, key) => {
          if(entry.status == 'published') {
            delete entry.history
            published[key] = entry
          }
        })

        res.json({ updateNeeded: true, msg: "Update needed", published })
      }
      else {
        res.json({ updateNeeded: false, msg: "Update not needed"})
      }
    })
    .catch(err => console.log(err))

  })

  app.post('/submit', (req, res) => {
    // get the apikey
    let apikey = req.headers['rev-api-key']
    let appid = req.headers['rev-app-id']

    //create/update account and sync dictionary
    account.createAccount(apikey, appid)
    .then(result => {
      return strManager.syncDictionary(apikey, appid, req.body)
    })
    .then(() => {
      return strManager.getStringData(apikey, appid, req.body.dict_key)
    })
    .then(clientDictionary => {
      res.json({
        success: true,
        msg: 'Successfully received strings.',
        dictionary: clientDictionary
      })
    })
    .catch(err => {
      console.log(err)
      res.json({ success: false, msg: 'Loading strings failed' })
    })
  })


  // put routes
  app.put('/string', (req, res) => {

  })

}
