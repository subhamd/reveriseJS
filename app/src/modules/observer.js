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
    node_id_map         = {},
    req_busy            = false;

window.revlocalise = window.revlocalise || {}

// mutation observer
export default function (obs_dictionary, settings, service) {

  let attribs = ['placeholder', 'title']

  if(!obs_dictionary.ids) obs_dictionary.ids = []
  if(!obs_dictionary.entries) obs_dictionary.entries = {}

  submitted_node_ids      = obs_dictionary.ids
  obs_dictionary_entries  = obs_dictionary.entries

  // if called multiple times, stop the previous observer
  if(observer) observer.disconnect()

  function mutateNode(n) {
    // only text and attribute nodes to be processed 
    if(n.nodeType === 3 || n.nodeType === 2) {

      let _nPos = absNodePos(n),
          _nId  = (n.__revloc__) ? nodeId(n, n.__revloc__.value): nodeId(n),
          processed_entities = n.nodeType === 3 ? processed_nodes : processed_attrs;

      // check if this node was processed before 
      if(!_nId && n.nodeValue.trim() === "") return
      else {
          if(!n.__revloc__)
            n.__revloc__ = { 
              value: n.nodeValue,
              is_new: (submitted_node_ids && submitted_node_ids[_nId]) ? false : true
            }
          else n.__revloc__.is_new = (submitted_node_ids && submitted_node_ids[_nId]) ? false : true

          processed_entities[_nPos] = { ref: n, id: _nId }
          if(obs_dictionary_entries && obs_dictionary_entries[_nId])
            n.nodeValue = obs_dictionary_entries[_nId][settings.currentLang]
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

  setInterval(() => {

    if(!submitted_node_ids || req_busy) return

    let new_nodes = [],
        num_nodes = 0,
        req_body = {
          url: normalizedLocation(),
          dict_key: dictKey(),
          data: {}
        }

    // get all the new nodes 
    objForEach(processed_nodes, (val, key) => {
      if(val.ref.__revloc__.is_new) {
          val.ref.__revloc__.is_new = false
          
          let _id = nodeId(val.ref, val.ref.__revloc__.value),
            _pos = nodePos(val.ref);

          if(!_id || val.ref.nodeValue.trim() === '' || val.ref.parentElement == null || submitted_node_ids[_id]) 
            return

          num_nodes++

          req_body.data[_id] = {
            id: _id,
            value: val.ref.__revloc__.value, // always send english text 
            url: normalizedLocation(),
            capture_url: location.href,
            nodePos: _pos
          }
        }
    })

    // get all the new attributes 
    // objForEach(processed_attrs, (val, key) => {
    //   if(val.ref.__revloc__.is_new) {
    //       val.ref.__revloc__.is_new = false
          
    //       let _id = nodeId(val.ref, val.ref.__revloc__.value),
    //         _pos = nodePos(val.ref);

    //       if(!_id || 
    //         val.ref.nodeValue.trim() === '' || 
    //         val.ref.ownerElement == null || // attributes have ownerElement set
    //         submitted_node_ids[_id]) 
    //         return

    //       num_nodes++

    //       req_body.data[_id] = {
    //         id: _id,
    //         value: val.ref.__revloc__.value, // always send english text 
    //         url: normalizedLocation(),
    //         capture_url: location.href,
    //         nodePos: _pos
    //       }
    //     }
    // })

    if(num_nodes > 0) {
      req_busy = true // enter busy state 
      service.submit(req_body)
      .then(d => {
        obs_dictionary.entries = obs_dictionary_entries = d.published
        obs_dictionary.ids = submitted_node_ids = d.ids
        req_busy = false // exit busy state 
      })
      .catch(err => {
        console.log(err)
        req_busy = false // exit busy state 
      })
    }
  }, 5000)
  


  // start observing
  observer.observe(document, {
    childList: true,
    subtree: true
  });

  return {
    processed_nodes,
    processed_attrs
  }
}


// temporary debugging helpers
window.revlocalise.showNewNodes = function() { console.log(new_nodes) }
window.revlocalise.showProcessedNodes = function() { 
  console.log({ ...processed_nodes, ...processed_attrs })
}
