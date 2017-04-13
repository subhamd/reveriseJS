import Promise from 'bluebird'
import { storageInit, getObject, setObject } from './storage-man'
import { nodeId, dictKey } from './keygen'
import { now, objForEach, make_error } from './utils'
import createService from './services'
import walker from './walker'

function factory () {
  let dictionary   = {},
      dict_key = dictKey()

  // ensure default settings are present at the backend
  storageInit()

  function updateStorage( response ) {
    let transformed_data = { lastUpdated: now(), entries: response.published }
    setObject(dict_key, transformed_data)
    makeInMemoryDictionary(transformed_data)
  }

  function makeInMemoryDictionary(data) {
    walker(node => {
      let id = nodeId(node)
      if(data.entries[id]) data.entries[id].ref = node
    })
    dictionary = data
  }

  return {
    // ensure data availability
    ensure(config) {
      let cached = getObject(dict_key)

      // create service instance
      let service = createService({
        base_url: config.base_url || 'http://localhost:8002/',
        headers: {
          'rev-api-key': config.apikey,
          'rev-app-id': config.appid,
          'Content-Type': 'application/json'
        }
      })

      return new Promise((resolve, reject) => {
        if(!cached) {
          service.submit().then(response => {
            updateStorage(response)
            resolve({ data: dictionary, settings: getObject('__settings__') })
          })
        }
        else {
          // validate if the cache is up to date
          service.checkUpdate(dict_key, cached.lastUpdated).then(response => {

            if(response.update_status === 'UPDATE_AVAILABLE') {
              updateStorage(response)
              resolve({ data: dictionary, settings: getObject('__settings__') })
            }

            else if(response.update_status === 'UPDATE_UNAVAILABLE') {
              makeInMemoryDictionary(cached)
              resolve({ data: dictionary, settings: getObject('__settings__') })
            }

            else if(response.update_status === 'NODATA')
              service.submit().then(response => {
                updateStorage(response)
                resolve({ data: dictionary, settings: getObject('__settings__') })
              })

            else reject(make_error('Unknown error in file sync-agent'))
          })
        }

      })
    }
  }
}

export default factory;

//
