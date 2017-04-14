import '../styles/main.scss'

import walker from './modules/walker'
import observer from './modules/observer'
import { objForEach } from './modules/utils'
import createSynchronizer from './modules/sync-agent'
import { languages, available_langs} from './modules/langs'
import { nodeId, nodePos, dictKey } from './modules/keygen'
import { setObject, getObject } from './modules/storage-man'
import createWidget, { setLanguageChangeHandler } from './modules/widget'

// retrieve cached dictionary and settings
let obs_dictionary = getObject(dictKey()),
    settings = getObject('__settings__'),
    obs_dictionary_entries = null;

obs_dictionary && (obs_dictionary_entries = obs_dictionary.entries);
settings || (settings = { currentLang: 'value' });

// expose the obs_dictionary as global
window.obs_dictionary = obs_dictionary
window.obs_dictionary_entries = obs_dictionary_entries

window.revlocalise = {

  getVersion() { return "0.0.1" },

  setLanguage( lang, syn_dictionary ) {
    if(available_langs.indexOf(lang) == -1) return false

    settings.currentLang = lang == 'english' ? 'value' : lang
    setObject('__settings__', settings)

    if(window.obs_dictionary)
    objForEach(window.obs_dictionary_entries, entry => {
      if(entry.ref)
        entry.ref.nodeValue = entry[settings.currentLang]
    })
    else if(syn_dictionary) {
      objForEach(syn_dictionary.entries, (value, key) => {
        value.ref.nodeValue = value[settings.currentLang]
      })
    }

    if(!syn_dictionary) setLanguageChangeHandler(lang)

  },

  getTranslation(string, language) { }, //to-do

  init( config ) {

    // start observing
    observer(obs_dictionary_entries, settings)

    // on load event
    window.onload = () => {

      let sync = createSynchronizer()

      sync.ensure( config ).then(({ data: syn_dictionary, settings }) => {
        // create the widget
        createWidget()

        // if obs_dictionary does not exists, use the syn_dictionary
        if(!(obs_dictionary && obs_dictionary_entries)) {
          objForEach(syn_dictionary.entries, (value, key) => {
            value.ref.nodeValue = value[settings.currentLang]
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

          objForEach(syn_dictionary.entries, (value, key) => {
            if(obs_dictionary_entries[key] && ( syn_dictionary.entries[key].lastUpdated > obs_dictionary_entries[key].lastUpdated ) ) {
              console.log("Found one new updated node")
              obs_dictionary_entries[key].ref.nodeValue = value[ settings.currentLang ]
            }
            if(!obs_dictionary_entries[key]) {
              obs_dictionary_entries[key] = syn_dictionary.entries[key]
              syn_dictionary.entries[key].ref.nodeValue = value[ settings.currentLang ]
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
}






//
