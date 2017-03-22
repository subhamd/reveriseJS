import objectAssign from 'object-assign'
import normalizeUrl from 'normalize-url'
import md5 from 'spark-md5'
import walker from './walker'
import fetch, { submit, checkUpdate } from './fetch'
import nodeId, { nodePos } from './nodeId'
import { storageInit, getObject, setObject } from './storageMan'

let _dictionary   = {},
    _settings = null,
    dictLangKeys  = ['hindi', 'gujarati', 'bengali']


export function normalizedLocation() {
  let loc_url = window.location.protocol + '//' + window.location.host + window.location.pathname
  return normalizeUrl(loc_url.trim())
}

// returns unique dictionary key
export function dictKey() {
  return md5.hash(normalizedLocation())
}

// load dictionary
function syncWithStorage(cb) {
  let dict_key = dictKey(),
      stored_data = getObject(dict_key)

  // no stored data
  if( !stored_data ) {
    // request payload
    let req_body = {
      url: normalizedLocation(),
      dict_key: dict_key,
      data: {}
    }

    // walk the DOM
    walker(node => {
      let _nodeId = nodeId(node)
      req_body.data[_nodeId] = {
        id: _nodeId,
        value: node.textContent,
        url: location.href,
        nodePos: nodePos(node)
      }
    })

    // submit data to server
    submit(req_body, response => {
      let store_data = {}
      store_data.timestamp = response.dictionary.updatedOn
      store_data.entries = response.dictionary.published
      cb && cb(store_data, true)
    })
  }
  // got stored data
  else {
    checkUpdate(dict_key, stored_data.timestamp, (update_info) => {
      console.log("Update info from server:")
      console.log(update_info)

      let _storedDict = stored_data.entries,
          new_data = {}

      // update stored data
      new_data.timestamp = update_info.updateNeeded ? (new Date()).getTime() : stored_data.timestamp
      new_data.entries = update_info.updateNeeded ? update_info.published : stored_data.entries

      if(_storedDict) {
        // store the node references in the dictionary
        walker(node => {
          let _nodeId = nodeId(node)
          if(_storedDict[_nodeId]) _storedDict[_nodeId].ref = node
        })

        // trigger callback
        cb && cb(new_data, update_info.updateNeeded)
      }
      else {
        cb & cb(new_data, update_info.updateNeeded)
      }
    })
  }
}

export default function factory() {

  // return -> class instance
  return {

    init: () => {
      storageInit()
      let settings = getObject('__settings__')

      // after sync save a ref
      syncWithStorage((dictionary, updateNeeded) => {
        _dictionary = dictionary

        if(updateNeeded) console.log("Update detected at the backend")
        if(!updateNeeded) console.log("Using from local cache")

        // set the dictionary for this page
        updateNeeded && setObject(dictKey(), _dictionary)

        // if dictionary is not empty
        if(_dictionary.entries) {
          // add node refs to the inmemory dictionary
          walker(node => {
            let _nodeId = nodeId(node)
            if(_dictionary.entries[_nodeId]) {
              _dictionary.entries[_nodeId].ref = node
            }
          })

          // translate page
          let currentLang = settings.currentLang
          for(let nodeId in _dictionary.entries) {
            let nodeData = _dictionary.entries[nodeId]
            let ref = nodeData.ref
            let translated = nodeData[currentLang]
            ref.textContent = translated
          }
        }
      })

    },

    getCurrent: () => {
      return _dictionary.entries
    },

    // the dictionary becomes aware of this node
    addNode: (node) => {
      let _nodeId = nodeId(node),
          text = node.textContent

      // initial dictionary entry for this node
      _dictionary[nodeId(node)] = {
        english: text,
        //other languages are to be added
      }
    }

  }
}





//
