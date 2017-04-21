import objectAssign from 'object-assign'
import { objForEach, now } from './utils'
import MutationObserver from 'mutation-observer'
import { nodeId, nodePos, nodeIdPos, absNodePos, dictKey, normalizedLocation } from './keygen'
import { nodeTreeWalker, is_allowed } from './walker'

let observer            = null,
    new_nodes           = {},
    intervalId          = null,
    submitted_node_ids  = null,
    processed_attrs     = {},
    processed_nodes     = {},
    obs_dictionary_entries = null,
    req_busy            = false;

window.revlocalise = window.revlocalise || {}
window.revlocalise.showNewNodes = function() { console.log(new_nodes) }
window.revlocalise.showProcessedNodes = function() { 
  console.log({ ...processed_nodes, ...processed_attrs })
}

let scanned_elements = {}

// mutation observer
export default function (obs_dictionary, settings, _submitted_node_ids, service) {
  let attribs = ['placeholder', 'title']

  submitted_node_ids = _submitted_node_ids
  obs_dictionary_entries = obs_dictionary.entries

  // if called multiple times, stop the previous observer
  if(observer) observer.disconnect()

  function mutateNode(n) {
    let _nPos = absNodePos(n),
        _nId  = null,
        processed_entities = n.nodeType === 3 ? 
                             processed_nodes : 
                             processed_attrs;

    // if this node is already translated before 
    if(
      obs_dictionary_entries &&
      processed_entities[_nPos] &&
      obs_dictionary_entries[processed_entities[_nPos].originalId][settings.currentLang] === n.nodeValue ) {
      // console.log("Rejected the node: " + _nPos + " current value : " + obs_dictionary_entries[processed_entities[_nPos].originalId][settings.currentLang] + 
      //   " original value : " + n.nodeValue)
      return;
    }
    
    // only text and attribute nodes to be processed 
    if(n.nodeType === 3 || n.nodeType === 2) {
      // calculate node id 
      _nId = nodeId(n)
      if(!_nId) return //must be invalid or user rejected node 

      // detect new node
      if(
        submitted_node_ids          && 
        n.nodeValue.trim() !== ""   &&
        !submitted_node_ids[_nId]   &&
        !processed_entities[_nPos]  &&
        (n.nodeType === 3 || n.nodeType === 2) ) {
        new_nodes[_nId] = n
      }

      if(
        obs_dictionary_entries && 
        (n.nodeType === 3 || n.nodeType === 2) && 
        obs_dictionary_entries[_nId] ) {
          processed_entities[_nPos] = { 
            updatedOn: now(), 
            originalId: _nId, 
            lastUpdated: obs_dictionary_entries[_nId].lastUpdated, 
            ref: n 
          }
          obs_dictionary_entries[_nId].ref = n
          obs_dictionary_entries[_nId].ref.nodeValue  = obs_dictionary_entries[_nId][settings.currentLang]
      }
    }

  }

  // install mutation observer
  observer = new MutationObserver( mutations => {

    mutations.forEach( mutation => {
      // handle newly inserted nodes
      if(mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if(is_allowed(node)) mutateNode(node)
          // if element node 
          if(node.nodeType === 1 && is_allowed(node)) 
            nodeTreeWalker(node, n => mutateNode(n))
        })
      }
    })
  })

  // start observing
  observer.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: attribs,
    attributeOldValue: true
  });

  
  // push new nodes to backend at regular interval
  if(intervalId) clearInterval(intervalId)
  else {
    setInterval(() => {

      if(req_busy) return 

      let req_data = {
        url: normalizedLocation(),
        dict_key: dictKey(),
        data: {}
      },

      num_nodes = 0;
      objForEach(new_nodes, (node, key) => {
        let id = nodeId(node),
            pos = nodePos(node)

        // this check will remove any nodes that has become orphan by now 
        if(!id) return
        
        num_nodes++
        req_data.data[id] = {
          id, 
          value: node.nodeValue,
          url: normalizedLocation(),
          capture_url: location.href,
          nodePos: pos
        }

        delete new_nodes[key]
      })

      
      if(num_nodes > 0) {

        console.log("New nodes found.")
        console.log(new_nodes)
        
        req_busy = true
        // push new nodes to backend
        service.submit(req_data).then(response => {
          submitted_node_ids = response.ids //store the new ids 
          req_busy = false
        })
        .catch(err => {
          req_busy = false
          console.log('Pushing new strings failed!')
        })
      }
      else {
        req_busy = false
        console.log("No new nodes found.")
      }

      // clear entries from processed nodes store which are not needed anymore
      // reason may be, unpublished from backend etc.
      let cleared = 0
      objForEach(processed_nodes, (value, key) => {
        if(!obs_dictionary.entries[value.originalId]) {
          cleared ++
          delete processed_nodes[key]
        }
      })
      objForEach(processed_attrs, (value, key) => {
        if(!obs_dictionary.entries[value.originalId]) {
          cleared ++
          delete processed_attrs[key]
        }
      })
      console.log(`Cleared ${cleared} entries from processed nodes store.`)

    }, 5000)
  }

  return {
    processed_nodes,
    processed_attrs
  }
}
