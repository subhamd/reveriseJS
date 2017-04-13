import '../styles/main.scss'
import walker from './modules/walker'
import { objForEach } from './modules/utils'
import createSynchronizer from './modules/sync-agent'
import { nodeId, nodePos, dictKey } from './modules/keygen'
import { setObject, getObject } from './modules/storage-man'
import createWidget, { setLanguageChangeHandler } from './modules/widget'

// retrieve cached dictionary and settings
let _dict = getObject(dictKey()), settings = getObject('__settings__'),
    obs_dictionary = null;
_dict && (obs_dictionary = _dict.entries);
settings || (settings = { currentLang: 'value' });

// expose the obs_dictionary as global
window.obs_dictionary = obs_dictionary

window.revlocalise = {

  getVersion() { return "0.0.1" },

  setLanguage(lang) {},  //to-do
  getTranslation(string, language) {}, //to-do

  init(config) {

    let attribs = ['placeholder', 'title']

    // install mutation observer
    var observer = new MutationObserver(mutations => {
      mutations.forEach( mutation => {

        // handle newly inserted nodes
        if(mutation.type == 'childList') {
          mutation.addedNodes.forEach(node => {
            let _nodeId = nodeId(node)
            if(obs_dictionary && obs_dictionary[_nodeId]) {
              obs_dictionary[_nodeId].ref = node
              node.nodeValue = obs_dictionary[_nodeId][settings.currentLang]
            }
          })
        }
      });
    });

    // start observing
    observer.observe(document, { attributes: true, childList: true, subtree: true });

    // add title ref -> title is not observed
    setTimeout(() => {
      let title = document.querySelector('title')
      if(title) {
        let textNode = title.childNodes[0],
        _id = nodeId(textNode)
        if(obs_dictionary && obs_dictionary[_id]) {
          obs_dictionary[_id].ref = textNode
          textNode.nodeValue = obs_dictionary[_id][settings.currentLang]
        }
      }
    }, 100)

    // on load event
    window.onload = () => {

      let sync = createSynchronizer()

      sync.ensure( config ).then(({ data: syn_dictionary, settings }) => {
        // create the widget
        createWidget()

        if(!obs_dictionary) {
          objForEach(syn_dictionary.entries, (value, key) => {
            value.ref.nodeValue = value[settings.currentLang]
          })
        }
        // patch update
        if(obs_dictionary && syn_dictionary.lastUpdated > _dict.lastUpdated) {
          objForEach(syn_dictionary.entries, (value, key) => {
            if(syn_dictionary.entries[key].lastUpdated > obs_dictionary[key].lastUpdated) {
              console.log("Found one new updated node")
              obs_dictionary[key].ref.nodeValue = value[ settings.currentLang ]
            }
          })
        }

        // when language is changed
        setLanguageChangeHandler(lang => {
          settings.currentLang = lang == 'english' ? 'value' : lang
          setObject('__settings__', settings)

          if(window.obs_dictionary) // dict build from observer
          objForEach(window.obs_dictionary, entry => {
            if(entry.ref)
              entry.ref.nodeValue = entry[settings.currentLang]
          })
          // obs_dictionary built from initial
          else objForEach(syn_dictionary.entries, (value, key) => {
            value.ref.nodeValue = value[settings.currentLang]
          })

        })

      })
    }
  }
}






//
