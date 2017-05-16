import '../styles/main.scss'

import './modules/DOM_Patch'
import observer from './modules/observer'
import createService from './modules/services'
import { nodeTreeWalker } from './modules/walker'
import { objForEach, now, empty } from './modules/utils'
import { languages, available_langs } from './modules/langs'
import { setObject, getObject, storageInit } from './modules/storage-man'
import { nodeId, nodePos, dictKey, absNodePos } from './modules/keygen'
import createWidget, { setLanguageChangeHandler } from './modules/widget'

import { getPullStream } from './modules/pullStream'
import { getPushStream } from './modules/pushStream'

// ensure default settings are present at the backend
storageInit()

// retrieve cached dictionary and settings
let dictionary      = getObject(dictKey()) || { entries: null, ids: [] },
    settings        = getObject('__settings__') || { currentLang: 'value' },
    content_nodes   = {};

// translate the page
function translatePage() {
  let nodes       = content_nodes.processed_nodes,
      attrs       = content_nodes.processed_attrs,
      entries     = dictionary.entries;

  objForEach(nodes, (val, key) => {
    let id = nodeId(val.ref, val.ref.__revloc__.value)
    if(entries[id] &&  val.ref.__revloc__) {
      val.ref.nodeValue = entries[id][settings.currentLang]
    }
  })

  objForEach(attrs, (val, key) => {
    let id = nodeId(val.ref, val.ref.__revloc__.value)
    if(entries[id] &&  val.ref.__revloc__) {
      val.ref.nodeValue = entries[id][settings.currentLang]
    }
  })
}

// revlocalise instance
window.revlocalise = window.revlocalise || {}


// init method
window.revlocalise.init = function( config ) {
    // create service instance
  let service = createService({
    base_url: config.base_url || 'http://localhost:8002/',
    headers: {
      'rev-api-key': config.apikey,
      'rev-app-id': config.appid,
      'Content-Type': 'application/json'
    }
  })
  
  // start observing
  content_nodes = observer(dictionary, settings, service)

  
  // page load handler
  window.onload = () => {
    // start pull string 
    getPullStream(service).subscribe(({ dict, settings }) => {
      createWidget() // create the widget

      if(dict && dict.entries) {
        dictionary.entries = dict.entries
        dictionary.ids = dict.ids
        dictionary.updatedOn = dict.updatedOn

        translatePage()
      }

      // when language is changed
      setLanguageChangeHandler(lang => {
        revlocalise.setLanguage(lang, true)
      })
    })

    // push stream will emit new submit data
    getPushStream(dictionary, content_nodes.processed_nodes, content_nodes.processed_attrs, settings).subscribe(pushData => {
      // if we got new data then 
      if(pushData.result) {
        //do ajax
        console.log(pushData)
      }

      pushData.continue() // continue regardless
    })

  }
}



// change translation language
window.revlocalise.setLanguage = function( lang, called_internally ) {

  if(available_langs.indexOf(lang) == -1 || empty(dictionary.entries)) return false

  settings.currentLang = lang == 'english' ? 'value' : lang
  setObject('__settings__', settings)

  let nodes       = content_nodes.processed_nodes,
      attrs       = content_nodes.processed_attrs,
      entries     = dictionary.entries;

  objForEach(nodes, (val, key) => {
    let id = nodeId(val.ref, val.ref.__revloc__.value)
    if(entries[id] &&  val.ref.__revloc__) {
      val.ref.nodeValue = entries[id][settings.currentLang]
    }
  })

  objForEach(attrs, (val, key) => {
    let id = nodeId(val.ref, val.ref.__revloc__.value)
    if(entries[id] &&  val.ref.__revloc__) {
      val.ref.nodeValue = entries[id][settings.currentLang]
    }
  })
  
  if(!called_internally) setLanguageChangeHandler(lang)
}


// get library version
window.revlocalise.getVersion = function() { return "0.0.1" }


// temporary debug helpers
window.revlocalise.showSettings = function() {
  console.log(getObject('__settings__'))
}

window.revlocalise.showDict = function() {
  let dict = getObject(dictKey()),
      published_count = 0,
      total_count = 0;

  objForEach(dict.entries, val => published_count++)
  objForEach(dict.ids, val => total_count++)

  console.log("Total strings published: " + published_count)
  console.log("Total strings submitted: " + total_count)
  console.log("Content: ", dict)
}

window.revlocalise.showDictKeys = function() {
  console.log( Object.keys(localStorage).filter(a => a != '__settings__') )
}

window.revlocalise.showSettings = function() {
  console.log(getObject('__settings__'))
}





//
