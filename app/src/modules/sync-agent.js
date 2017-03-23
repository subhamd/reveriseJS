import Promise from 'bluebird'
import { storageInit, getObject, setObject } from './storage-man'
import { nodeId, dictKey } from './keygen'
import { now, objForEach, make_error } from './utils'
import createService from './services'
import walker from './walker'

// create service instance
let service = createService({
  base_url: 'http://localhost:8002/',
  headers: {
    'rev-api-key': 'DEV_API_KEY',
    'rev-app-id': 'DEV_APP_ID',
    'Content-Type': 'application/json'
  }
})


function factory () {
  let dictionary   = {},
      dict_key = dictKey()

  // ensure default settings are present at the backend
  storageInit()

  function updateStorage(response) {
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
    ensure() {
      let cached = getObject(dict_key)

      return new Promise((resolve, reject) => {
        if(!cached) {
          service.submit().then(response => {
            updateStorage(response)
            resolve(response)
          })
        }
        else {
          service.checkUpdate().then(response => {

            if(response.update_status === 'UPDATE_AVAILABLE') {
              updateStorage(response)
              resolve(response)
            }

            else if(response.update_status === 'UPDATE_UNAVAILABLE') {
              getObject(dict_key)
              resolve(response)
            }

            else if(response.update_status === 'NODATA')
              service.submit().then(response => {
                updateStorage(response)
                resolve(response)
              })

            else reject(make_error('Failed'))
          })
        }

      })
    }
  }
}

export default factory;

//
