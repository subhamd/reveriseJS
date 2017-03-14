import '../styles/main.scss'

import createWidget, { setLanguageChangeHandler } from './modules/widget'
import walker from './modules/walker'
import fetch from './modules/fetch'
import nodeId, { nodePos } from './modules/nodeId'

let dictionary = {},  //key = source, value = target / language
    nodeMap = {},     //key = nodeId, value = original node info
    source_lang = 'english',
    target_lang = 'english';



// on window load
window.onload = () => {
  createWidget()

  // initialize nodemap and dictionary data
  // note: the nodemap may need to be updated from time to time if the page is dynamic
  walker(function(node) {

    let _nodeId = nodeId(node),
        text = node.textContent.trim()

    // first store the original node map with english text
    nodeMap[_nodeId] = {
      id: _nodeId,
      ref: node,
      content: text
    }

    // initial dictionary data
    dictionary[_nodeId + '#' + text] = {
      english: text
    }
  })

  // triggered when the language selection is changed
  setLanguageChangeHandler(function(lang) {
    // get all the source texts
    let source_strings = []
    let node_ids = []
    let target_lang = lang

    for(let id in nodeMap) {
      source_strings.push(nodeMap[id].content)
      node_ids.push(nodeMap[id].id)
    }

    // get the translated data from server
    fetch(source_strings, target_lang, function(response) {
      // update dictionary with new response
      node_ids.forEach(function(id, index) {
        let src_key = id + '#' + response[index].in

        // check and update dictionary with new language output/target string
        if(dictionary[src_key]) {
          dictionary[src_key][target_lang] = response[index].out
        }
        else {
          dictionary[src_key] = {}
          dictionary[src_key][target_lang] = response[index].out
        }
      })

      // now we are ready to translate the page
      translatePage(target_lang)
    })
  })


  // translates the page
  function translatePage(target_lang) {
    // update the page with translated text
    for(let node_id in nodeMap) {
      // build the dictionary key
      let dict_key = node_id + '#' + nodeMap[node_id].content
      nodeMap[node_id].ref.textContent = dictionary[dict_key][target_lang]
    }
  }
}
