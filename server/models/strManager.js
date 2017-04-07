import * as State from '../consts/stateTypes'
import dbc from '../db'
import Promise from 'bluebird'
import objectAssign from 'object-assign'
import translation from '../translationService'
import { _m, _g, objForEach, now } from '../utils'


export default function strManagerFactory() {

  let _langs = ['hindi', 'bengali', 'assamese', 'gujarati', 'kannada', 'marathi', 'malayalam', 'odia', 'telugu', 'tamil', 'punjabi'],
      _availableLang = ['hindi', 'punjabi', 'kannada', 'telugu']

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

    console.log(`Number of new strings to be translated ${ new_string_entries.length * _availableLang.length }`)

    // _availableLang is the order of promise seriese
    if(new_string_entries.length) {

      _availableLang.forEach(lang => {
        translate_promises.push(translation(new_string_entries, lang))
      })

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
          return dict
        })
    }

    // if no new strings added return original document back
    return Promise.resolve(dict)
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
      .then(updated_dict => {
        console.log("Writting translated dictionary to the DB.")
        return db.collection('STRINGS').update({ id: dict_key }, { $set: { 'entries': updated_dict.entries } })
      })

    },

    // will return a dictionary for a specific url
    getPublishedData (dict_key) {
      let db = null

      // connect
      return dbc.connect()
      .then(_db => {
        db = _db
        return db.collection('STRINGS').findOne({ id: dict_key }, { entries: 1, __meta__: 1 })
      })
      .then(dict => {
        let published = dict.entries || [],
        map = {}
        published.forEach(d => {
          if(d.status == 'published') map[d.id] = d
        })

        return {
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

        if(status == 'ANY') dict.entries.forEach(e => map[e.id] = e)
        else {
          dict.entries.forEach(e => {
            if(e.status == status) map[e.id] = e
          })
        }
        return map
      })
    },

    // update more than one node at a time
    bulkUpdate (apikey, appid, dict_key, node_keys, new_value) {
      let allUpdates = []

      return dbc.connect()
        .then(db => {

          let _paths = [],
              _values = []

          // dont forget to validate new data before proceeding

          objForEach(new_value, (val, key) => {
            _paths.push(`$set^apps.${appid}.dictionary.${dict_key}.entries.$.${key}`)
            _values.push(val)
          })

          // additionally update the timestamp
          _paths.push(`$set^apps.${appid}.dictionary.${dict_key}.entries.$.lastUpdated`)
          _values.push(now())

          // save snapshot in history
          _paths.push(`$push^apps.${appid}.dictionary.${dict_key}.entries.$.history`)
          _values.push({ updatedOn: now(), new_value })

          allUpdates.push(
            db.collection(apikey).update(
              _m({}, [`apps.${appid}.dictionary.${dict_key}`], [{ $exists: true }]),
              _m({}, [`$set^apps.${appid}.dictionary.${dict_key}.__meta__.lastUpdated`], [ now() ])
            )
          )

          node_keys.forEach(nodekey => {
            allUpdates.push(
              db.collection(apikey).update(
                _m({}, [`apps.${appid}.dictionary.${dict_key}.entries`], [ { $elemMatch: { id: nodekey } } ]),
                _m({}, _paths, _values))
            )
          })

          return Promise.all(allUpdates)
        })
    },

    // update a single node
    updateEntry (dict_key, node_key, new_value) {
      let db = null,
          updatable = {
            $set: { lastUpdated: now(), 'entries.$.lastUpdated': now() },
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
  }
}






//
