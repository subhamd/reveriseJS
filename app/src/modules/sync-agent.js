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
  
  // update local storage
  function updateStorage( response ) {
    let transformed_data = {
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
        // validate if the cache is up to date
        service.checkUpdate(dict_key, (cached && cached.updatedOn) || 0).then(response => {

          if(response.update_status === 'UPDATE_AVAILABLE') {
            updateStorage(response)
            resolve({ data: dictionary, settings: getObject('__settings__') })
            return
          }

          if(response.update_status === 'UPDATE_UNAVAILABLE') {
            resolve({ data: dictionary, settings: getObject('__settings__') })
            return
          }
          // when backend is empty
          if(response.update_status === 'NODATA') {
            // first translate back to english 
            window.revlocalise.setLanguage('english')
            
            // clear this dictionary 
            localStorage.removeItem(dict_key)
            
            resolve({ data: {}, settings: getObject('__settings__') })
            return
          }
          
          reject(make_error('Unknown error in file sync-agent'))
        })
      })
    }
  }
}

export default factory;

//
