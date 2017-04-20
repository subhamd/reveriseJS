import '../styles/main.scss'

import walker from './modules/walker'
import observer from './modules/observer'
import { objForEach } from './modules/utils'
import createService from './modules/services'
import createSynchronizer from './modules/sync-agent'
import { languages, available_langs } from './modules/langs'
import { nodeId, nodePos, dictKey } from './modules/keygen'
import { setObject, getObject } from './modules/storage-man'
import createWidget, { setLanguageChangeHandler } from './modules/widget'

// retrieve cached dictionary and settings
let obs_dictionary = getObject(dictKey()),
    settings = getObject('__settings__'),
    obs_dictionary_entries = null,
    translated_nodes = {};

obs_dictionary && (obs_dictionary_entries = obs_dictionary.entries);
settings || (settings = { currentLang: 'value' });


// revlocalise instance
window.revlocalise = window.revlocalise || {}

// expose the obs_dictionary as global
window.revlocalise.obs_dictionary = obs_dictionary
window.revlocalise.obs_dictionary_entries = obs_dictionary_entries


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
  window.revlocalise.live_nodes = observer(obs_dictionary_entries, settings, obs_dictionary.ids, service)


  window.onload = () => {
    let sync = createSynchronizer()
    

    // temporary : to be removed
    setTimeout(() => {
      var div = document.createElement('div')
      div.innerHTML = '<div title="This should get detected"><span>Hello Man</span><i>What is this?</i><a href="#">Link man!</a><a>I am king.</a></div>'
      document.body.prepend(div);
    }, 5000)

    sync.ensure( config, service ).then(({ data: syn_dictionary, settings }) => {
      // create the widget
      createWidget()

      // if obs_dictionary does not exists, use the syn_dictionary
      if(!(obs_dictionary && obs_dictionary_entries)) {
        objForEach(syn_dictionary.entries, (value, key) => {
          obs_dictionary_entries[key] = value
          // ref may be absent if the node is dynamically inserted
          //if(value.ref) {
            //value.ref.nodeValue = value[settings.currentLang]
          //}
        })
      }
      // patch update
      if(obs_dictionary && ( syn_dictionary.lastUpdated > obs_dictionary.lastUpdated ) ) {

        // remove extra items from obs dictionary
        objForEach(obs_dictionary_entries, ( value, key ) => {
          if(!syn_dictionary.entries[key]) {
            obs_dictionary_entries[key].ref.nodeValue = obs_dictionary_entries[key].value
            delete obs_dictionary_entries[key]
          }
        })
        
        // translate with updated synced dictionary
        objForEach(syn_dictionary.entries, (value, key) => {
          //if(obs_dictionary_entries[key] && ( syn_dictionary.entries[key].lastUpdated > obs_dictionary_entries[key].lastUpdated ) ) {
            //console.log("Found one new updated node")
            //obs_dictionary_entries[key].ref.nodeValue = value[ settings.currentLang ]
          //}
          if(!obs_dictionary_entries[key]) {
            obs_dictionary_entries[key] = syn_dictionary.entries[key]
            //syn_dictionary.entries[key].ref.nodeValue = value[ settings.currentLang ]
          }
        })
      }

      // when language is changed
      setLanguageChangeHandler(lang => {
        revlocalise.setLanguage(lang, syn_dictionary)
      })
    })
  }
}



// change translation language
window.revlocalise.setLanguage = function( lang, syn_dictionary ) {

  if(available_langs.indexOf(lang) == -1) return false

  settings.currentLang = lang == 'english' ? 'value' : lang
  setObject('__settings__', settings)

  let nodes = window.revlocalise.live_nodes.processed_nodes,
      attrs = window.revlocalise.live_nodes.processed_attrs;

  objForEach(nodes, val => {
    if(window.revlocalise.obs_dictionary) {
      val.ref.nodeValue = window.revlocalise.obs_dictionary_entries[val.originalId][settings.currentLang]
    }
    else if(syn_dictionary)
      val.ref.nodeValue = syn_dictionary[val.originalId][settings.currentLang]
  })
  
  objForEach(attrs, val => {
    if(window.revlocalise.obs_dictionary) {
      val.ref.nodeValue = window.revlocalise.obs_dictionary_entries[val.originalId][settings.currentLang]
    }
    else if(syn_dictionary)
      val.ref.nodeValue = syn_dictionary[val.originalId][settings.currentLang]
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
