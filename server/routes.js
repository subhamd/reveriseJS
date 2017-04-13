import cors from 'cors'
import bodyParser from 'body-parser'
import dbc from './db'
import strManagerFactory from './models/strManager'
import { objForEach, _g, _m } from './utils'

export default function makeRoutes(app) {

  // configure express app
  app.use(cors())
  app.use(bodyParser.json({limit: '50mb'}))

  let strManager  = strManagerFactory()

  // get routes
  app.get('/', (req, res) => {
    res.end('JS Localizer backend!')
  })


  // accepts strings, returns dictionary if newer
  app.post('/update-check', (req, res) => {
    // check for update and if available send back the new data
    let apikey = req.headers['rev-api-key'],
        appid = req.headers['rev-app-id'],
        __appid = appid.replace('.', '~'),
        db = null
    let { dict_key, timestamp } = req.body

    dbc.connect().then(_db => {
      db = _db
      return db.collection('APPS').findOne({ apikey, id: appid })
    })
    .then(doc => {
      if(!doc) throw new Error('Invalid apikey or appid')
      return db.collection('STRINGS').findOne({ id: dict_key })
    })
    .then(dict => {
      // doc doesnt exists
      if(!dict) {
        res.json({ update_status: 'NODATA', updateNeeded: false, msg: "No update needed" })
        return
      }

      let last_updated = dict.__meta__.lastUpdated

      if( last_updated > timestamp ) {
        strManager.getPublishedData(dict_key)
        .then(data => {
          res.json({ update_status: 'UPDATE_AVAILABLE', updateNeeded: true, msg: "Update needed",  published: data.published })
        })
      }
      else {
        res.json({ update_status: 'UPDATE_UNAVAILABLE', updateNeeded: false, msg: "Update not needed", published: {} })
      }
    })
    .catch(err => {
      console.log(err)
      res.json({ error: true, message: 'Something went wrong at the backend.' })
    })
  })

  // submit strings
  app.post('/submit', (req, res) => {
    // get the apikey
    let apikey = req.headers['rev-api-key'],
        appid = req.headers['rev-app-id'],
        __appid = appid.replace('.', '~')

    // validate app
    dbc.connect().then(db => {
      return db.collection('APPS').findOne({ id: __appid, apikey })
    })
    .then(doc => {
      // validate app first
      if(!doc) {
        res.json({ success: false, msg: 'APP validation failed' }); return }

      strManager.syncDictionary(doc.apikey, doc.id, req.body)
      .then(() => strManager.getPublishedData(req.body.dict_key))
      .then(published => {
        res.json({
          success: true,
          msg: 'Successfully received strings.',
          ...published
        })
      })
      .catch(err => {
        console.log(err)
        res.json({ success: false, msg: 'Something went wrong at backend' })
      })
    })

  })


  // fetch strings with given status
  app.post('/fetch', (req, res) => {
    let apikey = req.headers['rev-api-key'],
        appid = req.headers['rev-app-id'],
        __appid = appid.replace('.', '~'),
        db = null,
        { dict_key, status } = req.body

    console.log(req.body)

    dbc.connect()
    .then(_db => {
      db = _db
      return db.collection('APPS').findOne({ id: appid, apikey })
    })
    .then(app => {
      if(!app) throw new Error("Invalid apikey or appid")
      return strManager.getStrings(dict_key, status)
    })
    .then(data => {
      let array = []
      objForEach(data, item => array.push(item))
      res.json(array)
    })
    .catch(err => {
      console.log(err)
      res.json({ error: err })
    })
  })


  // update an entry in the dictionary
  app.post('/update-entry', (req, res) => {
    let apikey = req.headers['rev-api-key'],
        appid = req.headers['rev-app-id'],
        __appid = appid.replace('.', '~'),
        db = null,
        { dict_key, node_key, node_data } = req.body

    dbc.connect()
    .then(db => {
      return db.collection('APPS').findOne({ apikey, id: appid })
    })
    .then(doc => {
      if(!doc) throw new Error("Invalid apikey or appid")
      return strManager.updateEntry(dict_key, node_key, node_data)
    })
    .then(data => res.json(data))
  })


  // update multiple nodes with common value
  app.post('/update-multi', (req, res) => {
    let apikey = req.headers['rev-api-key'],
        appid = req.headers['rev-app-id'],
        __appid = appid.replace('.', '~'),
        db = null,
        { dict_key, node_keys, node_data } = req.body

    dbc.connect().then(_db => {
      db = _db
      return db.collection('APPS').findOne({ apikey, id: appid })
    })
    .then(app => {
      if(!app) throw new Error("Invalid apikey or appid")
      return strManager.bulkUpdate(dict_key, node_keys, node_data)
    })
    .then(r => res.json(r))
    .catch(err => {
      console.log(err)
      res.json({ success: false, message: 'Failed to perform bulk update' })
    })
  })


  // change the state of an entry
  app.post('/get-dicts', (req, res) => {
    let apikey = req.headers['rev-api-key'],
        appid = req.headers['rev-app-id'],
        __appid = appid.replace('.', '~')
    strManager.getDicts(apikey, __appid)
    .then(dicts => {
      res.json(dicts)
    })
    .catch(err => {
      console.log(err)
      res.json("Error occured while trying to fetch dictionary infos.")
    })
  })

}











//
