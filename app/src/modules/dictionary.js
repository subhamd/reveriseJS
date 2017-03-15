import walker from './walker'
import fetch from './fetch'
import nodeId, { nodePos, sourceKey, sourceKeyFromNode } from './nodeId'

let dictionary = {},
    nodeMap = {}

export default function factory() {

  // add functions for loading from localStorage


  return {
    // walks the DOM and creates a nodemap
    init: () => {

      if(dictionary['__meta__']) return false

      // put timestamp etc in the meta entry
      dictionary['__meta__'] = {
        is_initialized: true
      }

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
        dictionary[sourceKey(_nodeId, text)] = {
          english: text
        }
      })

    },

    // return the current nodemap
    getNodeMap: () => {
      return nodeMap
    },

    // given node_id and target_lang returns the translated string
    getTranslation: (node_id, target_lang) => {
      let entry = dictionary[sourceKey(node_id, nodeMap[node_id].content)]
      if(entry && entry[target_lang]) {
        return entry[target_lang]
      } else {
        return false
      }
      return false
    },

    // the dictionary becomes aware of this node
    addNode: (node) => {
      let _nodeId = nodeId(node),
          text = node.textContent

      nodeMap[_nodeId] = {
        id: _nodeId,
        ref: node,
        content: text
      }

      // initial dictionary entry for this node
      dictionary[sourceKey(_nodeId, text)] = {
        english: text
      }

    },

    // update dictionary for a node id, will not update any un added nodes
    update: ( target_lang, cb = null ) => {
      // get all the source texts
      let source_strings = []
      let node_ids = []

      for(let id in nodeMap) {
        source_strings.push(nodeMap[id].content)
        node_ids.push(id)
      }

      // get the translated data from server
      fetch(source_strings, target_lang, function(response) {
        // update dictionary with new response
        node_ids.forEach(function(id, index) {

          let src_key = sourceKey(id, nodeMap[id].content)

          // check and update dictionary with new language output/target string
          if(dictionary[src_key]) {
            dictionary[src_key][target_lang] = response[index].out
          }
          else {
            dictionary[src_key] = {}
            dictionary[src_key][target_lang] = response[index].out
          }
        })

        console.log(dictionary)
        cb && cb(true)
      })

    }

  }
}





//
