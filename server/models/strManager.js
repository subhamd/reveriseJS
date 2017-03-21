import dbc from '../db'
import Promise from 'bluebird'
import objectAssign from 'object-assign'
import translation from '../translationService'
import { objForEach, now } from '../utils'


export default function strManagerFactory() {
  let _langs = ['hindi', 'bengali', 'assamese', 'gujarati', 'kannada', 'marathi', 'malayalam', 'odia', 'telugu', 'tamil', 'punjabi'],
      _availableLang = ['hindi', 'kannada', 'punjabi']


  // apply translation to a document
  function applyTranslation(doc, appid, dict_key, data) {
    let source_strings = [],
        translate_promises = [],
        db_dictionary_entries = doc.apps[appid].dictionary[dict_key].entries

    if(db_dictionary_entries === data) { // new dictionary
      objForEach(db_dictionary_entries, (entry, key) => {
        source_strings.push({ id: entry.id, value: entry.value })
      })
    } else {  // existing dictionary
      objForEach(data, (entry, key) => {
        // only add new nodeids
        if(!db_dictionary_entries[key]) {
          db_dictionary_entries[key] = entry
        }
      })
      objForEach(db_dictionary_entries, (entry, key) => {
        if(entry.status === 'notprocessed') {
          source_strings.push({ id: entry.id, value: entry.value })
        }
      })
    }

    // _availableLang is the order of promise seriese
    if(source_strings.length) {
      _availableLang.forEach(lang => {
        translate_promises.push(translation(source_strings, lang))
      })

      return Promise.all(translate_promises)
      .then(responses => { //array of array of strings
        doc.apps[appid].dictionary[dict_key]['__meta__'].lastUpdated = now()
        _availableLang.forEach((lang, index) => [
          responses[index].forEach((response) => {
            db_dictionary_entries[response.id][lang] = response.value
            db_dictionary_entries[response.id].lastUpdated = now()
            db_dictionary_entries[response.id].status = 'processed' //we just processed this node
          })
        ])
        return doc
      })
    }

    return Promise.resolve(doc)
  }

  return {
    // sync with client
    syncDictionary: (apikey, appid, req_body) => {
      let dict_key = req_body.dict_key,
          new_dict_data = req_body.data,
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
        console.log('Modifying the doc...')
        // if no document found then it is an error
        if( !doc ) {
          reject("No document found in this collection.")
          return
        }

        // augment incomming data
        objForEach(new_dict_data, (item) => {
          item.status = 'notprocessed'
          item.history = []
          _langs.forEach(lang => item[lang] = item.value)
        })

        // create an app if not already created
        if(!doc.apps[__appid]) {
          // default entry
          doc.apps[__appid] = {
            appid,
            dictionary: {}
          }
          doc.apps[__appid].dictionary[dict_key] = { __meta__: {}, entries: new_dict_data }
          doc.apps[__appid].dictionary[dict_key]['__meta__'].lastUpdated = now()
        }
        return doc
      })
      .then(doc => { // then translate document
        console.log('Translating the doc...')
        return applyTranslation(doc, __appid, dict_key, new_dict_data)
      })
      .then(doc => { // then update db
        console.log('Updating the database..')
        let _update = {}
        _update[`apps.${__appid}`] = doc.apps[__appid]
        return collection.update( { apps: { $exists: true } }, { $set: _update })
      })
    },

    // will return a dictionary for a specific url
    getStringData: (apikey, appid, dictionary_id) => {
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
        _query[`apps.${__appid}.dictionary.${dictionary_id}`] = { $exists: true }
        return collection.findOne(_query, _filter)
      })
      // modify result and return
      .then(doc => {
        let data = doc.apps[__appid]['dictionary'][dictionary_id],
            published = {}
        // delete history from result
        for(let id in data.entries) {
          // only select published strings
          if(data.entries[id].status === 'published') {
            delete data.entries[id].history
            published[id] = data.entries[id]
          }
        }
        return {
          published,
          updatedOn: data.__meta__.lastUpdated
        }
      })
    }
  }
}






//
