import dbc from '../db'
import Promise from 'bluebird'
import objectAssign from 'object-assign'

export default function strManagerFactory() {
  let _langs = ['hindi', 'bengali', 'assamese', 'gujarati', 'kannada', 'marathi', 'malayalam', 'odia', 'telugu', 'tamil', 'punjabi']

  return {

    // sync with client
    syncDictionary: (apikey, appid, req_body) => {
      let _dict_id = req_body.dict_key,
          _dict_data = req_body.data,
          __appid //escaped appid to be used as app key


      // transform inbound data
      function transformDataIn(dict_key, dict_data) {
        for(let id in dict_data) {
          // if there is no status key then we know that is a first call so make their status pending
          dict_data[id].status  = 'pending'
          _langs.forEach(lang => {
            dict_data[id][lang] = dict_data[id].value
          })

          dict_data[id].history = []
        }
        return dict_data
      }


      // transform outbound data
      function transformDataOut(dict_key, dict_data) {
        return dict_data
      }


      // the incomming dictionary entries does not have any status info and any other
      // data necessary for backend processing, here we add the default values for those
      // example info -> 'status' and timeline for dictionary entries
      function updateDictionary(app, dict_key, dict_data) {
        transformDataIn(dict_key, dict_data)
        if(!app.dictionary) app.dictionary = {}
        if(!app.dictionary[dict_key]) app.dictionary[dict_key] = dict_data
        else {
          // update the dictionary by extending existing dictionary
          app.dictionary[dict_key] = objectAssign(dict_data, app.dictionary[dict_key])
        }
      }

      // return promise
      return new Promise((resolve, reject) => {
        dbc.connect().then(db => {

          // store the collection reference
          let collection = db.collection(apikey)

          // get the users doc
          collection.findOne().then(doc => {

            // if no document found then it is an error
            if( !doc ) {
              reject("No document found in this collection.")
              return
            }

            __appid = appid.replace('.', '~')
            // if there are no apps then create a new one
            // may be verify appid with revup later
            if(!doc.apps) doc.apps = {}
            if(!doc.apps[__appid]) {

              doc.apps[__appid] = { appid, dictionary: {}}
              doc.apps[__appid].dictionary[_dict_id] = _dict_data
            }

            // find the required app from apps collection
            if(doc.apps[__appid]) {
              // update/sync the dictionary
              updateDictionary(doc.apps[__appid], _dict_id, _dict_data)

              let _update = {}
              _update[`apps.${__appid}`] = doc.apps[__appid]

              // update collection
              collection.update( { apps: { $exists: true } }, { $set: _update })
              .then(result => {
                resolve(result)
              })
              .catch(err => reject(err))
            }
            else {
              reject(`No app found with the given appid -> ${appid}`)
            }


          }).catch(err => reject(err))
        }).catch(err => reject(err))
      })
    },

    // will return a dictionary for a specific url
    getStringData: (apikey, appid, dictionary_id) => {
      return new Promise((resolve, reject) => {
      dbc.connect().then(db => {
        let collection = db.collection(apikey),
        __appid = appid.replace('.', '~'),
        _query = {},
        _filter = {}
        _filter[`apps.${__appid}.dictionary.${dictionary_id}`] = 1

        _query[`apps.${__appid}.dictionary.${dictionary_id}`] = { $exists: true }

          collection.findOne(_query, _filter).then(doc => {
            let data = doc.apps[__appid]['dictionary'][dictionary_id],
                published = {}

            // delete history from result
            for(let id in data) {
              if(data[id].status === 'published') {
                delete data[id].history
                published[id] = data[id]
              }
            }
            // resolve with only published data
            resolve(published)
          }).catch(err => reject(err))

        })
      })
    }
  }
}






//
