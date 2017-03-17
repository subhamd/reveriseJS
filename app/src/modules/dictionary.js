import objectAssign from 'object-assign'
import normalizeUrl from 'normalize-url'
import md5 from 'spark-md5'
import walker from './walker'
import fetch, {submit} from './fetch'
import nodeId, { nodePos, sourceKey, sourceKeyFromNode } from './nodeId'

let _dictionary   = {},
    _settings = null,
    dictLangKeys  = ['hindi', 'gujarati', 'bengali']


// returns unique dictionary key
function dictKey() {
  let data = normalizeUrl(location.href.trim())
  return md5.hash(data)
}

// load dictionary
function syncWithStorage(cb) {
  let dict_key = dictKey(),
      stored_data = localStorage.getItem(dict_key),
      settings = localStorage.getItem('__settings__')

  if(!settings) {
    settings = {
      currentLang: 'english'
    }
    localStorage.setItem('__settings__', settings)
    _settings = settings
  }

  // no stored data
  if(!stored_data) {
    // request payload
    let req_body = {
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
      // update localStorage
      //localStorage.setItem(dict_key, JSON.stringify(response))
      // trigger callback
      cb(response)
    })
  }
  // got stored data
  else {
    let _storedDict = JSON.parse(stored_data)

    // store the node references in the dictionary
    walker(node => {
      let _nodeId = nodeId(node)
      if(_storedDict[_nodeId]) _storedDict[_nodeId].ref = node
    })

    // trigger callback
    cb && cb(_storedDict)
  }
}

export default function factory() {

  // return -> class instance
  return {

    init: () => {

      // after sync save a ref
      syncWithStorage(dictionary => {
        _dictionary = dictionary
        console.log(_dictionary)
      })

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
