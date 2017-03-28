import '../styles/main.scss'

import { nodeId, nodePos, dictKey } from './modules/keygen'
import createWidget, { setLanguageChangeHandler } from './modules/widget'
import { objForEach } from './modules/utils'
import walker from './modules/walker'
import { setObject, getObject } from './modules/storage-man'
import createSynchronizer from './modules/sync-agent'

// on window load
window.onload = () => {

  let sync = createSynchronizer(),
      dict_key =

  sync.ensure().then(({ data, settings }) => {
    // create the widget
    createWidget()

    // restore last language
    objForEach(data.entries, entry => {
      entry.ref.textContent = entry[ settings.currentLang ]
    })

    // when language is changed
    setLanguageChangeHandler(lang => {
      settings.currentLang = lang == 'english' ? 'value' : lang
      setObject('__settings__', settings)
      objForEach(data.entries, entry => {
        entry.ref.textContent = entry[settings.currentLang]
      })
    })

  })

}







//
