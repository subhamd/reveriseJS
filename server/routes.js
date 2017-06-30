import dbc from './db'
import cors from 'cors'
import { auth } from './middlewares'
import bodyParser from 'body-parser'
import strManagerFactory from './models/strManager'
import { objForEach, _g, _m, now, success, fail } from './utils'

/*
 ************************************
 ************************************
 ** APPLICATION ROUTES DEFINATIONS **
 ************************************
 ************************************
 */

// used to keep track of submit requests 
let busyApps = {}

// creates app routes
export default function makeRoutes(app) {

  // configure express app
  app.use(cors())
  app.use(bodyParser.json({limit: '50mb'}))
  
  // create strings manager instance 
  let strManager  = strManagerFactory()

  // get routes
  app.get('/', (req, res) => {
    res.end('JS Localizer backend!')
  })

  
  // submit jobs 
  app.post('/submit-job', auth, (req, res) => {
    res.json({ body: req.body })
  })











  // accepts strings, returns dictionary if newer
  app.post('/update-check', auth, (req, res) => {
    // check for update and if available send back the new data
    let { dict_key, timestamp } = req.body

    dbc.connect().then(db => {
      return db.collection('STRINGS').findOne({ id: dict_key })
    })
    .then(dict => {
      // doc doesnt exists
      if(!dict) {
        res.json(success("No data at backend", {
          update_needed: false, 
          update_status: 'NODATA'
        }))

        return
      }
      
      // last update time of the dictionary 
      let last_updated = dict.__meta__.lastUpdated
      
      // compare with client time 
      if( last_updated > timestamp ) {
        strManager.getAllEntries(dict_key)
        .then(data => {
          res.json(success("Update needed", {
                      update_needed: true,
                      update_status: 'UPDATE_AVAILABLE',
                      published: data.published,
                      updatedOn: data.updatedOn, // the dictionary's __meta__.lastUpdated
                      ids: data.ids
                    }))
        })
      }
      else {
        res.json(success("Update not needed", { 
          update_status: 'UPDATE_UNAVAILABLE', 
          update_needed: false, 
          published: {} }))
      }
    })
    .catch(err => {
      console.log(err)
      res.json(fail('Something went wrong at the backend.', { err: err.message }))
    })
  })

  // submit strings
  app.post('/submit', auth, (req, res) => {
    // reject if busy
    if(busyApps[req.appid]) {
      res.json(success('Busy serving previous request'))
      return
    }
    // enter busy state
    busyApps[req.appid] = true
    
    // call sync dictionary 
    strManager.syncDictionary(req.apikey, req.appid, req.body)
    .then(() => strManager.getAllEntries(req.body.dict_key))
    .then(published => {
      delete busyApps[req.appid]
      // < to-do: remove history from result >
      res.json(success('Successfully received strings.', {...published} ))
    })
    .catch(err => {
      console.log(err)
      delete busyApps[req.appid]
      res.json(fail('Something went wrong at backend', { err: err.message }))
    })
  })


  // fetch strings with given status
  app.post('/fetch', auth, (req, res) => {
    let { dict_key, status } = req.body,
        array = [],
        db = null;

    strManager.getStrings(dict_key, status)
    .then(data => {
      objForEach(data, item => array.push(item))
      res.json(array)
    })
    .catch(err => {
      console.log(err)
      res.json(fail("Failed to fetch strings", { err: err.messasge }))
    })
  })

  // update an entry in the dictionary
  app.post('/update-entry', auth, (req, res) => {
    let { dict_key, node_key, node_data } = req.body,
        db = null;

    strManager.updateEntry(dict_key, node_key, node_data)
    .then(r =>  res.json(success("Update successful", { mongo_result: r })))
    .catch(err => {
      console.log(err)
      res.json(fail(err.message))
    })
  })

  // update multiple nodes with common value
  app.post('/update-multi', auth, (req, res) => {
    let { dict_key, node_keys, node_data } = req.body,
        db = null;

    strManager.bulkUpdate(dict_key, node_keys, node_data)
    .then(r => res.json(success("Update successful")))
    .catch(err => {
      console.log(err)
      res.json(fail(err.message))
    })
  })


  // update all similar nodes
  app.post('/update-similar-nodes', auth, (req, res) => {
    let { value, node_data } = req.body

    strManager.updateAllSimilar(req.apikey, req.appid, value, node_data)
    .then(r => res.json({ success: true, mongo_result: r }))
    .catch(err => {
      res.json(fail(err.message))
    })
  })

  // change the state of an entry
  app.post('/get-dicts', auth, (req, res) => {
    strManager.getDicts(req.apikey, req.appid)
    .then(dicts => {
      res.json(dicts)
    })
    .catch(err => {
      console.log(err)
      res.json(fail(err.message))
    })
  })

}

// end
