import '../styles/main.scss'

import nodeId, { nodePos, sourceKey, sourceKeyFromNode } from './modules/nodeId'
import createWidget, { setLanguageChangeHandler } from './modules/widget'
import walker from './modules/walker'
import dictionaryFactory from './modules/dictionary'

// create dictionary instance
let dictionary = dictionaryFactory()

// on window load
window.onload = () => {

  // create the widget
  createWidget()

  // initialize dictionary
  dictionary.init()

  // triggered when the language selection is changed
  setLanguageChangeHandler(function(lang) {


  })

}







//
