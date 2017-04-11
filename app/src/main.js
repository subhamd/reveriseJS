import '../styles/main.scss'

import { nodeId, nodePos, dictKey } from './modules/keygen'
import createWidget, { setLanguageChangeHandler } from './modules/widget'
import { objForEach } from './modules/utils'
import walker from './modules/walker'
import { setObject, getObject } from './modules/storage-man'
import createSynchronizer from './modules/sync-agent'

window.revlocalise = {

  init(config) {

    window.onload = () => {

      window.document.body.style.visibility = 'hidden'

      let sync = createSynchronizer()

      sync.ensure( config ).then(({ data, settings }) => {
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

        document.body.style.visibility = 'visible'
      })
    }
  }
}






//
