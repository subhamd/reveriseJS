import '../styles/main.scss'

import { nodeId, nodePos } from './modules/keygen'
import createWidget, { setLanguageChangeHandler } from './modules/widget'
import walker from './modules/walker'
import { setObject, getObject } from './modules/storage-man'
import createSynchronizer from './modules/sync-agent'

// on window load
window.onload = () => {

  let sync = createSynchronizer()

  sync.ensure().then(data => {
    // create the widget
    createWidget()

    console.log(data)
  })
}







//
