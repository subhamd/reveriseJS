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
  function applyTranslation(doc, appid, dict_key, data) {
    let source_strings = [],
        translate_promises = [],
        db_dictionary_entries_arr = _g(doc, `apps^${appid}^dictionary^${dict_key}^entries`) || [],
        db_dictionary_entries = {}

    // entry(array) -> entry(Map)
    db_dictionary_entries_arr.forEach(entry => {
      db_dictionary_entries[entry.id] = entry
    })

    // only add new nodeids
    objForEach(data, (entry, key) => {
      if(!db_dictionary_entries[key]) {
        db_dictionary_entries[key] = entry
      }
    })

    objForEach(db_dictionary_entries, (entry, key) => {
      if(entry.status === State.PENDING) {
        source_strings.push({ id: entry.id, value: entry.value })
      }
    })

    // _availableLang is the order of promise seriese
    if(source_strings.length) {
      _availableLang.forEach(lang => {
        translate_promises.push(translation(source_strings, lang))
      })

    return Promise.all(translate_promises)
      .then(responses => { //array of array of strings

        _m(doc, [`apps^${appid}^dictionary^${dict_key}^__meta__^lastUpdated`], [ now() ])

        // update entries with translated strings
        _availableLang.forEach((lang, index) => [
          responses[index].forEach((response) => {
            _m(db_dictionary_entries,
            [
              `${response.id}^${lang}`,
              `${response.id}^lastUpdated`,
              `${response.id}^status`
            ],
            [ response.value, now(), 'processed' ])
          })
        ])

        // entry(Map) -> entry(array)
        db_dictionary_entries_arr = []
        objForEach(db_dictionary_entries, (entry, key) => {
          db_dictionary_entries_arr.push(entry)
        })
        // write update to the document object
        _m(doc, [`apps^${appid}^dictionary^${dict_key}^entries`], [ db_dictionary_entries_arr ])
        return doc
      })
    }

    // if no new strings added return original document back
    return Promise.resolve(doc)
  }

  return {
    // sync with client
    syncDictionary (apikey, appid, req_body) {
      let dict_key = req_body.dict_key,
          new_dict_data = req_body.data,
          dict_url = req_body.url,
          __appid = appid.replace('.', '~') //escaped appid to be used as app key

      let collection = null

      return dbc.connect()
      .then(db => {
        console.log('Connecting to db...')
        collection = db.collection(apikey)
        return collection.findOne()
      })
      .then(doc => {
        // verify app id here
        return Promise.resolve(doc)
      })
      .then(doc => {
        console.log('Formatting document...')
        // if no document found then it is an error
        if( !doc ) {
          reject("No document found in this collection.")
          return
        }

        // augment incomming data
        objForEach(new_dict_data, (item) => {
          item.status = State.PENDING
          item.history = []
          _langs.forEach(lang => item[lang] = item.value)
        })

        // create an app if not already created
        if(!doc.apps[__appid]) {
          // default entry
          doc.apps[__appid] = {
            appid
          }
        }

        // create a dictionary under the app if not already created
        if(!doc.apps[__appid]['dictionary']) {
          doc.apps[__appid].dictionary = {}
        }

        // create dictionary entry if doesnt exist already
        if(!doc.apps[__appid].dictionary[dict_key]) {
          doc.apps[__appid].dictionary[dict_key] = {}
        }

        // create meta node
        if(!doc.apps[__appid].dictionary[dict_key]['__meta__']) {
          doc.apps[__appid].dictionary[dict_key]['__meta__'] = {}
          doc.apps[__appid].dictionary[dict_key]['__meta__'].lastUpdated = now()
          doc.apps[__appid].dictionary[dict_key]['__meta__'].url = dict_url
        }

        // create entries
        if(!doc.apps[__appid].dictionary[dict_key].entries) {
          doc.apps[__appid].dictionary[dict_key].entries = []
          objForEach(new_dict_data, (entry) => {
            entries.push(doc.apps[__appid].dictionary[dict_key].entries)
          })
        }

        return doc
      })
      .then(doc => { // then translate document
        console.log('Translating document...')
        return applyTranslation(doc, __appid, dict_key, new_dict_data)
      })
      .then(doc => { // then update db
        console.log('Updating database..')
        return collection.update(
          _m({}, [`apps^$exists`], [ true ]),
          _m({}, [`$set^apps.${__appid}`], [ doc.apps[__appid] ])
        )
      })
    },

    // will return a dictionary for a specific url
    getPublishedData (apikey, appid, dictionary_id) {
      let __appid = appid.replace('.', '~')

      // connect
      return dbc.connect()
      .then(db => {
        let collection = db.collection(apikey)
        return collection
      })
      // query collection
      .then(collection => {
        let _query = {},
        _filter = {}
        _filter[`apps.${__appid}.dictionary.${dictionary_id}`] = 1
        _query[`apps.${__appid}.dictionary.${dictionary_id}.entries`] = { $exists: true }
        return collection.findOne(_query, _filter)
      })
      // modify result and return
      .then(doc => {
        let data = doc.apps[__appid]['dictionary'][dictionary_id],
            published = {}
        // delete history from result
        data.entries.forEach(entry => {
          if(entry.status === State.PUBLISHED) {
            delete entry.history
            published[entry.id] = entry
          }
        })

        return {
          published,
          updatedOn: data.__meta__.lastUpdated
        }
      })
    },

    // get phrases with status
    getStrings (apikey, appid, dict_key, status) {
      return dbc.connect()
      .then(db => {
        let filter_clause = _m({}, [`apps.${appid}.dictionary.${dict_key}.entries`], [true]);
        return db.collection(apikey).findOne({}, filter_clause)
      })
      .then(doc => {
        if( doc.apps && doc.apps[appid] ) {
          let dict_entries = _g(doc, `apps^${appid}^dictionary^${dict_key}^entries`),
              filtered = {}

          if(status !== State.ANY) {
            dict_entries.forEach(entry => {
              if(entry.status == status) {
                filtered[entry.id] = entry
              }
            })
          }
          else {
            dict_entries.forEach(entry => {
              filtered[entry.id] = entry
            })
          }
          return filtered
        }
      })
    },

    // update a single node
    updateEntry (apikey, appid, dict_key, node_key, new_value) {
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

        // dictionary is modified so update timestamp of the dictioanry
        _paths.push(`$set^apps.${appid}.dictionary.${dict_key}.__meta__.lastUpdated`)
        _values.push(now())

        // save snapshot in history
        _paths.push(`$push^apps.${appid}.dictionary.${dict_key}.entries.$.history`)
        _values.push({ updatedOn: now(), new_value })

        return db.collection(apikey).update(
          _m({}, [`apps.${appid}.dictionary.${dict_key}.entries.id`], [ node_key ]),
          _m({}, _paths, _values))
      })
    },

    getDicts(apikey, appid) {
      let search_clause = _m({}, [`apps.${appid}`], [{ $exists: true }]),
          filter_clause = _m({}, [`apps.${appid}.dictionary`], [true])

      return dbc.connect()
      .then(db => {
        return db.collection(apikey).findOne(search_clause, filter_clause)
      })
      .then(doc => {
        let keys = []
        if(!doc) return keys

        let dictionary = _g(doc, `apps^${appid}^dictionary`)
        if(!dictionary) return keys

        objForEach(dictionary, (val, key) => {
          keys.push({ key, url: val.__meta__.url })
        })

        return keys
      })
    }
  }
}






//
