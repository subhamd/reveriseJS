import Promise from 'promise-polyfill'
import objectAssign from 'object-assign'
import { nodeId, dictKey } from './keygen'
import { now, objForEach, make_error } from './utils'
import { storageInit, getObject, setObject, clearAll } from './storage-man'

function factory () {
  let dictionary   = {},
      dict_key = dictKey()

  // ensure default settings are present at the backend
  storageInit()

  function updateStorage( response ) {

    let transformed_data = {
      createdOn: now(),
      updatedOn: response.updatedOn,  // => local creation time
      entries: response.published,
      ids: response.ids
    }
    // before setting check quota and delete old dictionaries if required
    setObject(dict_key, transformed_data)
    dictionary = transformed_data
  }

  return {
    // ensure data availability
    ensure(config, service) {
      let cached = getObject(dict_key)

      return new Promise((resolve, reject) => {
        if(!cached) {
          service.submit().then(response => {
            if(response.success) {
              updateStorage(response)
              resolve({ data: dictionary, settings: getObject('__settings__') })
            }
            else {
              clearAll() // => clear localStorage
              reject("Could not submit data.")
            }
          })
        }
        else {
          // validate if the cache is up to date
          service.checkUpdate(dict_key, cached.updatedOn).then(response => {

            if(response.update_status === 'UPDATE_AVAILABLE') {
              updateStorage(response)
              resolve({ data: dictionary, settings: getObject('__settings__') })
            }

            else if(response.update_status === 'UPDATE_UNAVAILABLE') {
              //makeInMemoryDictionary(cached)
              resolve({ data: dictionary, settings: getObject('__settings__') })
            }
            // when backend is empty
            else if(response.update_status === 'NODATA') {
              // first translate back to english 
              window.revlocalise.setLanguage('english')
              // then submit 
              service.submit().then(response => {
                updateStorage(response)
                resolve({ data: dictionary, settings: getObject('__settings__') })
              })
            }
            else reject(make_error('Unknown error in file sync-agent'))
          })
        }

      })
    }
  }
}

export default factory;

//
