import { Observable } from 'rxjs/Observable'
import { nodeId, dictKey } from './keygen'
import { storageInit, getObject, setObject, clearAll } from './storage-man'

// updates local storage
function updateStorage( response ) {
	let transformed_data = {
	  updatedOn: response.updatedOn,  // => local creation time
	  entries: response.published,
	  ids: response.ids
	}
	// before setting check quota and delete old dictionaries if required
	setObject(dictKey(), transformed_data)
	return transformed_data
}

export function getPullStream(service) {
	let dictionary  = {},
      	dict_key 	= dictKey()

	return Observable.create( ( observer ) => {

		let cached = getObject(dict_key) // get the dictionary 

		// validate if the cache is up to date
		service.checkUpdate(dict_key, (cached && cached.updatedOn) || 0)
		.then(response => {

			if(response.update_status === 'UPDATE_AVAILABLE') {
			  let stored = updateStorage(response)
			  observer.next({ dict: stored, settings: getObject('__settings__') })
			  observer.complete() // may be check update at regular interval TBD
			  return
			}

			if(response.update_status === 'UPDATE_UNAVAILABLE') {
			  observer.next({ dict: cached, settings: getObject('__settings__') })
			  observer.complete() // may be check update at regular interval TBD
			  return
			}
			// when backend is empty
			if(response.update_status === 'NODATA') {
			  // first translate back to english 
			  window.revlocalise.setLanguage('english')
			  
			  // clear this dictionary 
			  localStorage.removeItem(dict_key)
			  
			  observer.next({ dict: null, settings: getObject('__settings__') })
			  observer.complete() // may be check update at regular interval TBD
			  return
			}
		})
		.catch(reason => observer.error(reason))
	})
}