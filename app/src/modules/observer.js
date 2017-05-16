import objectAssign from 'object-assign'
import { objForEach, now } from './utils'
import MutationObserver from 'mutation-observer'
import { nodeId, nodePos, nodeIdPos, absNodePos, dictKey, normalizedLocation } from './keygen'
import { nodeTreeWalker, is_allowed } from './walker'

import { getMutationStream } from './mutationStream'


let observer            = null,
    new_nodes           = {},
    submitted_node_ids  = null,
    processed_attrs     = {},
    processed_nodes     = {},
    published_entries = null;

window.revlocalise = window.revlocalise || {}

// mutation observer
export default function (dictionary, settings ) {
  
  if(!dictionary.ids) dictionary.ids = []
  if(!dictionary.entries) dictionary.entries = {}

  submitted_node_ids = dictionary.ids
  published_entries  = dictionary.entries
    
  // use stream
  getMutationStream().subscribe(({ id: _nId, node: n, absPos: _nPos }) => {
    // only text and attribute nodes to be processed 
    let processed_entities = n.nodeType === 3 ? processed_nodes : processed_attrs;
    // check if this node was processed before 
    if(!n.__revloc__)
      n.__revloc__ = { 
        value: n.nodeValue,
        __temp__: null,
        is_new: (submitted_node_ids && submitted_node_ids[_nId]) ? false : true
      }
    else n.__revloc__.is_new = (submitted_node_ids && submitted_node_ids[_nId]) ? false : true

    processed_entities[_nPos] = { ref: n, id: _nId }
    if(published_entries && published_entries[_nId])
      n.nodeValue = published_entries[_nId][settings.currentLang]
  })

  return {
    processed_nodes,
    processed_attrs
  }
}


// temporary debugging helpers
window.revlocalise.getProcessedNodes = function() { 
  let arr = []
  objForEach({...processed_nodes, ...processed_attrs}, (v, k) => {
    v.selector = k
    arr.push(v)
  })
  return arr
}
