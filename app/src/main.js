import '../styles/main.scss'

import createWidget, { setLanguageChangeHandler } from './modules/widget'
import walker from './modules/walker'
import nodeId, { nodePos, sourceKey, sourceKeyFromNode } from './modules/nodeId'
import dictionaryFactory from './modules/dictionary'

// create dictionary instance
let dictionary = dictionaryFactory()

// save a ref to nodeMap
let nodeMap = dictionary.getNodeMap()

// on window load
window.onload = () => {

  // create the widget
  createWidget()

  // initialize dictionary
  dictionary.init()

  // triggered when the language selection is changed
  setLanguageChangeHandler(function(lang) {
    // update the dictionary for target language
    dictionary.update(lang, () => {
      translatePage(lang)
    })

  })


  // translates the page
  function translatePage(target_lang) {
    // update the page with translated text
    for(let node_id in nodeMap) {
      let translated = dictionary.getTranslation(node_id, target_lang)
      if(translated) {
        nodeMap[node_id].ref.textContent = translated
      }
    }
  }

}







//
