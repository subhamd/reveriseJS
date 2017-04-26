import '../styles/main.scss'

import observer from './modules/observer'
import createService from './modules/services'
import { nodeTreeWalker } from './modules/walker'
import { objForEach, now } from './modules/utils'
import createSynchronizer from './modules/sync-agent'
import { languages, available_langs } from './modules/langs'
import { setObject, getObject } from './modules/storage-man'
import { nodeId, nodePos, dictKey, absNodePos } from './modules/keygen'
import createWidget, { setLanguageChangeHandler } from './modules/widget'

// retrieve cached dictionary and settings
let obs_dictionary = getObject(dictKey()) || { entries: null, ids: [] },
    settings = getObject('__settings__') || { currentLang: 'value' },
    translated_nodes = {};


// revlocalise instance
window.revlocalise = window.revlocalise || {}

// expose the obs_dictionary as global
window.revlocalise.obs_dictionary = obs_dictionary
//window.revlocalise.obs_dictionary_entries = obs_dictionary_entries

function manualTranslate() {
    let nodes = window.revlocalise.live_nodes.processed_nodes,
      attrs = window.revlocalise.live_nodes.processed_attrs,
      nodes_empty = Object.keys(nodes).length === 0,
      attrs_empty = Object.keys(attrs).length === 0,
      entries = obs_dictionary.entries;

    nodeTreeWalker(document, n => {
      let _nodeId = nodeId(n),
          _absNodePos = absNodePos(n);

      if(entries[_nodeId]) {
        let dest = n.nodeType === 2 ? attrs : nodes;

        // add to processed nodes
        dest[_absNodePos] = {
          updatedOn: now(), 
          originalId: _nodeId, 
          lastUpdated: entries[_nodeId].lastUpdated, 
          ref: n
        }
        // translate value 
        n.nodeValue = entries[_nodeId][settings.currentLang]
      }
    })
}


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
  window.revlocalise.live_nodes = observer(obs_dictionary, settings, service)


  window.onload = () => {

    let sync = createSynchronizer()

    sync.ensure( config, service ).then(({ data: syn_dictionary, settings }) => {
      createWidget() // create the widget
      // when language is changed
      setLanguageChangeHandler(lang => {
        revlocalise.setLanguage(lang, syn_dictionary)
      })
    })
  }
}



// change translation language
window.revlocalise.setLanguage = function( lang, syn_dictionary ) {

  if(available_langs.indexOf(lang) == -1 || window.revlocalise.obs_dictionary.entries == null) 
    return false

  settings.currentLang = lang == 'english' ? 'value' : lang
  setObject('__settings__', settings)

  let nodes = window.revlocalise.live_nodes.processed_nodes,
      attrs = window.revlocalise.live_nodes.processed_attrs,
      nodes_empty = Object.keys(nodes).length === 0,
      attrs_empty = Object.keys(attrs).length === 0,
      entries = window.revlocalise.obs_dictionary.entries;
  
  if(nodes_empty || attrs_empty) manualTranslate()

  objForEach(nodes, (val, key) => {
    let id = nodeId(val.ref, val.ref.__revloc__.value)
    if(entries[id] &&  val.ref.__revloc__) {
      val.ref.nodeValue = entries[id][settings.currentLang]
    }
  })
  

  if(!syn_dictionary) setLanguageChangeHandler(lang)
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
