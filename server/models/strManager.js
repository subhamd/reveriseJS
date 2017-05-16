import * as State from '../consts/stateTypes'
import dbc from '../db'
import Promise from 'bluebird'
import objectAssign from 'object-assign'
import translation from '../translationService'
import { _m, _g, objForEach, now, success, fail, empty } from '../utils'

// factory method
export default function strManagerFactory() {

  let _langs = ['hindi', 'bengali', 'assamese', 'gujarati', 'kannada', 'marathi', 'malayalam', 'odia', 'telugu', 'tamil', 'punjabi'],
      _availableLang = ['hindi', 'punjabi', 'kannada', 'telugu', 'tamil']

  // apply translation to a document
  function applyTranslation(dict, new_data) {
    let translate_promises = [],
        new_string_entries = [],
        db_dict_map = {}

    dict.entries.forEach(d => db_dict_map[d.id] = d)

    // only add new nodeids
    if(dict.entries.length == 0) new_string_entries = new_data
    else
    new_data.forEach(entry => {
      if(!db_dict_map[entry.id]) new_string_entries.push(entry)
    })

    console.log(`Number of new strings to be translated ${ new_string_entries.length }`)

    // _availableLang is the order of promise seriese
    if(new_string_entries.length) {

      // call translation for each available langiages 
      _availableLang.forEach(lang => {
        translate_promises.push(translation(new_string_entries, lang))
      })
      
      // when all the requests are processed 
      return Promise.all(translate_promises)
        .then(responses => { //array of array of strings
          // update dictionary timestamp
          dict.__meta__.lastUpdated = now()
          // update entries with translated strings
          _availableLang.forEach((lang, index) => {
            responses[index].forEach((response, index) => {
              new_string_entries[index][lang] = response.value
              new_string_entries[index]['lastUpdated'] = now()
              new_string_entries[index]['status'] = 'processed'
            })
          })
          // update the input dict
          new_string_entries.forEach(entry => dict.entries.push(entry))
          return { dict, new_string_entries }
        })
    }

    // if no new strings added return original document back
    return Promise.resolve({ dict, new_string_entries })
  }

  /* The public interface */

  return {

    // sync with client
    syncDictionary (apikey, appid, req_body) {
      let dict_key = req_body.dict_key,
          new_data = [],
          dict_url = req_body.url,
          __appid = appid.replace('.', '~'),
          db = null

      objForEach(req_body.data, (value, key) => {
        new_data.push(value)
      })

      return dbc.connect()
      //[1] ==> connect and return app
      .then(_db => {
        console.log('Connecting to db...')
        db = _db
        return db.collection('APPS').findOne({ id: appid, apikey })
      })

      //[2] ==> update app
      .then(app => {
        console.log('Formatting document...')
        // if no document found then it is an error
        if( !app ) throw new Error("No document found, probably invalid apikey or appid")

        // push the dictionary info in app if already there
        let dict_index = app.dictionaries.findIndex(checkItem => checkItem.id == dict_key)
        if(dict_index != -1) {
          return db.collection('APPS')
          .update({ id: appid, apikey }, { $set: { dictionaries:  app.dictionaries } })
          .then(r => app.dictionaries[dict_index].parts)
        }
        // else update the app to accomodate new dictionary info
        else {
          let entry = { id: dict_key, parts: 1 }
          return db.collection('APPS')
          .update({ id: appid, apikey }, { $push: { dictionaries:  entry } })
          .then(r => entry.parts)
        }
      })

      //[3] ==> attempt retrieve dictionary
      .then(numParts => {
        // handle partitioned dictionary in future
        return db.collection('STRINGS').findOne({ id: dict_key })
      })

      //[4] ==> resolve dictionary
      .then(dict => {
        // insert the dictionary if not already available
        if(!dict) {
          let dict_value = {
            id: dict_key,
            __meta__: { lastUpdated: now(), url: dict_url },
            entries: []
          }
          return db.collection('STRINGS').insert(dict_value).then(r => dict_value)
        }
        return dict //pass to next
      })

      //[5] ==> translate and put back data into dictionary
      .then(dict => {
        // augment incomming data
        new_data.forEach(entry => {
          entry.history = []
          entry.status = 'PENDING'
          _availableLang.forEach(lang => entry[lang] = entry.value)
        })

        console.log("Translating newly found strings...")
        return applyTranslation(dict, new_data)
      })

      //[6] ==> write the dictionary to database
      .then(({ dict : updated_dict, new_string_entries }) => {
        if(new_string_entries.length) {
          console.log("Writting translated dictionary to the DB.")
          return db.collection('STRINGS').update({ id: dict_key }, { $set: { 'entries': updated_dict.entries, '__meta__.lastUpdated': now() } })
        }
        return true
      })
    },

    // will return a dictionary for a specific url
    getAllEntries (dict_key) {
      let db = null

      // connect
      return dbc.connect()
      .then(_db => {
        db = _db
        return db.collection('STRINGS').findOne({ id: dict_key }, { entries: 1, __meta__: 1 })
      })
      .then(dict => {
        let published = dict.entries || [],
        map = {},
        ids = {} // => ids of all entries

        published.forEach(d => {
          if(d.status == 'published') {
            // exclude unneeded meta data from response
            delete d.url
            delete d.history
            delete d.capture_url

            map[d.id] = d
          }
          ids[d.id] = true
        })

        return {
          ids,
          published: map,
          updatedOn: dict.__meta__.lastUpdated
        }
      })
    },

    // get phrases with status
    getStrings (dict_key, status) {
      let db = null

      return dbc.connect()
      .then(db => {
        return db.collection('STRINGS').findOne({ id: dict_key }, { entries: true })
      })
      .then(dict => {
        let map = {}
        if(!dict || !dict.entries) return {}

        if(status.toUpperCase() == 'ANY') dict.entries.forEach(e => map[e.id] = e)
        else {
          dict.entries.forEach(e => {
            if(e.status == status) map[e.id] = e
          })
        }
        return map
      })
    },

    // update more than one node at a time
    bulkUpdate (dict_key, node_keys, new_value) {
      let allUpdates = [],
          db = null,
          curated_new_value = {},
          updatable = {
            $set: { '__meta__.lastUpdated': now(), 'entries.$.lastUpdated': now() },
            $push: { 'entries.$.history': { lastUpdated: now(), curated_new_value } }
          };

      return dbc.connect()
        .then(_db => {
          db = _db

          objForEach(new_value, (value, key) => {
            // validate before adding to update query  
            if(_availableLang.indexOf(key) != -1 && (typeof value === 'string')) {
              updatable.$set[`entries.$.${key}`] = value
              curated_new_value[key] = value
            }
          })

          // cannot update multiple array elements at one go thus call update multiple time
          node_keys.forEach(node_key => {
            console.log(curated_new_value)
            allUpdates.push(db.collection('STRINGS').update({ id: dict_key, 'entries.id': node_key }, updatable))
          })

          return Promise.all(allUpdates)
        })
    },
    
    // update all similar nodes 
    updateAllSimilar(apikey, appid, value, node_data) {
      let db      = null,
          updates = null,
          curated_node_data = {};
      
      // validate data: only language key values are allowed 
      objForEach(node_data, (val, key) => {
        if(_availableLang.indexOf(key) != -1 && (typeof val === 'string')) {
          curated_node_data[key] = val 
        }
      })

      // nothing to update 
      if(empty(curated_node_data)) return Promise.resolve([])

      return dbc.connect().then(_db => {
        db = _db
        return db.collection('APPS').findOne({ apikey, id: appid })
      })
      .then(app => {
        let dicts = app.dictionaries
        if(dicts.length) return dicts.map(a => a.id)
        return []
      })
      .then(dict_ids => {
        let entry_ids = []

        dict_ids.forEach(did => {
          let f = db.collection('STRINGS').findOne({ id: did, entries: { $elemMatch: { value: value } } }, { _id: 0, id: 1, entries: { $elemMatch: { value: value } }, "entries.id": 1, "entries.value": 1 })
          entry_ids.push(f)
        })
        
        // wait till all entry update finish
        return Promise.all(entry_ids).then(docs => {
          return docs.filter(d => d != null).map(doc => {
            return {
              doc_id: doc.id,
              entry_ids: doc.entries.map(e => e.id)
            }
          })
        })
      })
      .then(dict_entries => {
        // promises
        let update_promises = []

        // for each dictionary
        dict_entries.forEach(dict_entry => {

          // update the dictionary last update time 
          update_promises.push(db.collection('STRINGS').update({ id: dict_entry.doc_id }, { $set: { "__meta__.lastUpdated": now() } })
          .then(r => {
            return Promise.resolve({ dict: true, ...r.result })
          }))

          // for each entries 
          dict_entry.entry_ids.forEach((entry, index) => {
            let eid = dict_entry.entry_ids[index] // get the entry id
            let update_clause = {} // initialize update info 

            // prepare updateable data 
            objForEach(curated_node_data, (val, key) => {
              update_clause['entries.$.' + key] = val
            })

            // update the node value
            update_promises.push(db.collection('STRINGS').update({ id: dict_entry.doc_id, entries: { $elemMatch: { id: eid } } }, { $set: update_clause }))
          })
        })
        
        // return the update result
        return Promise.all(update_promises)
      })
    },

    // update a single node
    updateEntry (dict_key, node_key, new_value) {
      let db = null,
          updatable = {
            $set: { '__meta__.lastUpdated': now(), 'entries.$.lastUpdated': now() },
            $push: { 'entries.$.history': { lastUpdated: now(), new_value } }
          }

      // curate new_value here
      //
      objForEach(new_value, (value, key) => {
        updatable.$set[`entries.$.${key}`] = value
      })

      return dbc.connect()
      .then(_db => {
        db = _db
        return db.collection('STRINGS').update({ id: dict_key, 'entries.id': node_key }, updatable)
      })
    },
    
    // get dictionary id and page url tuples
    getDicts(apikey, appid) {
      let db = null
      return dbc.connect()
      .then(_db => {
        db = _db
        return db.collection('APPS').findOne({ apikey, id: appid })
      })
      .then(app => {
        let dict_ids = app.dictionaries.map(d => d.id)
        return db.collection('STRINGS').find({ id: { $in: dict_ids } }, { id: true, __meta__: true, _id: false }).toArray()
      })
      .then(dicts => {
        return dicts.map(d => ({ key: d.id, url: d.__meta__.url }))
      })
    }
  } // end of return
} // end of factory






//
