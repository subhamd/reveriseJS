import '../styles/main.scss'

import nodeId, { nodePos, sourceKey, sourceKeyFromNode } from './modules/nodeId'
import createWidget, { setLanguageChangeHandler } from './modules/widget'
import walker from './modules/walker'
import dictionaryFactory, { dictKey } from './modules/dictionary'
import getOrSet, { setObject, getObject } from './modules/storageMan'

// create dictionary instance
let dictionary = dictionaryFactory()

// on window load
window.onload = () => {

  // get or set settings
  let settings = getOrSet('__settings__', { currentLang: 'english' })

  // create the widget
  createWidget()

  // initialize dictionary
  dictionary.init()

  // triggered when the language selection is changed
  setLanguageChangeHandler(function(lang) {
    let _lang = lang === 'english' ? 'value' : lang
    
    setObject('__settings__', settings)

    let dict = dictionary.getCurrent()

    for(let nodeId in dict) {
      let nodeData = dict[nodeId]
      let ref = nodeData.ref
      let translated = nodeData[_lang]
      ref.textContent = translated
    }
  })

}







//
