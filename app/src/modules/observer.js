import objectAssign from 'object-assign'
import { objForEach, now } from './utils'
import MutationObserver from 'mutation-observer'
import { nodeId, nodePos, dictKey, normalizedLocation } from './keygen'
import { nodeWalker } from './walker'

let observer            = null,
    new_nodes           = {},
    intervalId          = null,
    submitted_node_ids  = null,
    processed_attrs     = {}; 

window.revlocalise = window.revlocalise || {}
window.revlocalise.showNewNodes = function() { console.log(new_nodes) }

let scanned_elements = {}

// mutation observer
export default function(obs_dictionary_entries, settings, _submitted_node_ids, service) {
  let attribs = ['placeholder', 'title']

  submitted_node_ids = _submitted_node_ids

  // if called multiple times, stop the previous observer
  if(observer) observer.disconnect()

  // install mutation observer
  observer = new MutationObserver( mutations => {

    mutations.forEach( mutation => {

      // handle newly inserted nodes
      if(mutation.type === 'childList') {
        
        mutation.addedNodes.forEach(node => {

          let _nodeId = nodeId(node)
          
          // translate new text node
          if(obs_dictionary_entries && node.nodeType === 3 && obs_dictionary_entries[_nodeId]) {
            obs_dictionary_entries[_nodeId].ref = node
            node.nodeValue = obs_dictionary_entries[_nodeId][settings.currentLang]
          }
          // detect new text nodes 
          if(submitted_node_ids && node.nodeType === 3 && !submitted_node_ids[_nodeId]) {
            if(node.nodeValue.trim() != "") new_nodes[_nodeId] = node
          }
          
          // if element node 
          if(node.nodeType === 1) {
            // process text nodes 
            // search through children subtree
            nodeWalker(node, n => {
              let _nodeId = nodeId(n)
              // process text nodes
              if(obs_dictionary_entries && obs_dictionary_entries[_nodeId]) {
                obs_dictionary_entries[_nodeId].ref = n
                obs_dictionary_entries[_nodeId].ref.nodeValue = obs_dictionary_entries[_nodeId][settings.currentLang]
              }
              // detect new nodes
              if(submitted_node_ids && n.nodeType === 3 && !submitted_node_ids[_nodeId]) {
                if(n.nodeValue.trim() != "") new_nodes[_nodeId] = n
              }
            })

            // search attributes of the newly inserted nodes' subtree
            node.querySelectorAll('[placeholder], [title]').forEach(element => {
              let attrs = element.attributes
              // for each attribute
              for(let i = 0; i < attrs.length; i++) {
                if(attribs.indexOf(attrs[i].nodeName.toLowerCase()) != -1) {
                  let _nodeId = nodeId(attrs[i]),
                      _nodePos = nodePos(attrs[i]);
                  
                  // translate attributes
                  if(obs_dictionary_entries && obs_dictionary_entries[_nodeId]) {
                    processed_attrs[_nodePos] = { updatedOn: now(), originalId: _nodeId } //keep track of processed attributes
                    obs_dictionary_entries[_nodeId].ref = attrs[i]
                    attrs[i].nodeValue = obs_dictionary_entries[_nodeId][settings.currentLang]
                  }

                  // detect new attributes 
                  if(submitted_node_ids && !submitted_node_ids[_nodeId] && attrs[i].nodeValue.trim() != "") {
                    // not encountered before (must be new attribute)
                    if(!processed_attrs[_nodePos]) {
                      processed_attrs[_nodePos] = { updatedOn: now(), originalId: _nodeId } //keep track of processed attributes
                      new_nodes[_nodeId] = attrs[i]
                    }
                    // encountered before
                    if(
                      obs_dictionary_entries &&
                      processed_attrs[_nodePos] && 
                      processed_attrs[_nodePos].updatedOn < now()) {
                        let originalId = processed_attrs[_nodePos].originalId
                        // if already translated i.e. no new node
                        if(attrs[i].nodeValue != obs_dictionary_entries[originalId][settings.currentLang]) {
                          new_nodes[_nodeId] = attrs[i]
                        }
                    }
                  }
                }
              }
            })

          }

        })
      }

      // process attribute change
      // if(mutation.type == 'attributes' && ( attribs.indexOf( mutation.attributeName ) != -1 ) ) {
      //   let attr = mutation.target.attributes[ mutation.attributeName ],
      //       old_val = mutation.oldValue,
      //       _nodeId = nodeId(attr)

      //   // found in dictionary
      //   if(obs_dictionary_entries && obs_dictionary_entries[_nodeId]) {

      //     obs_dictionary_entries[_nodeId].ref = attr

      //     // translate
      //     if(old_val !== obs_dictionary_entries[ _nodeId ][ settings.currentLang ])
      //       attr.nodeValue = obs_dictionary_entries[ _nodeId ][ settings.currentLang ]
      //   }
      // }

    });
  });

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
      
      let req_data = {
        url: normalizedLocation(),
        dict_key: dictKey(),
        data: {}
      },
      num_nodes = 0;
  
      objForEach(new_nodes, node => {
        let id = nodeId(node),
            pos = nodePos(node)
        
        num_nodes++
        req_data.data[id] = { id, value: node.textContent,
          url: normalizedLocation(),
          capture_url: location.href,
          nodePos: pos
        }
      })
      
      if(num_nodes > 0) {
        console.log("New nodes found: ")
        console.log(new_nodes)
        new_nodes = {}
      }

      // service.submit(req_data).then(response => {
      //   new_nodes = {}
      //   submitted_node_ids = response.ids //store the new ids 

      //   console.log("New nodes detected.")
      //   console.log(response)
      //   // storage will be updated on next reload
      // })
      // .catch(err => {
      //   console.log('Pushing new strings failed!')
      // })
      // else {
      //   console.log("No new nodes discovered.")
      // }

    }, 5000)
  }

  // add title ref -> title is not observed
  // one time replacement at document load
  // setTimeout(() => {
  //   let title = document.querySelector('title')
  //   if(title) {
  //     let textNode = title.childNodes[0],
  //     _id = nodeId(textNode)
  //     if(obs_dictionary_entries && obs_dictionary_entries[_id]) {
  //       obs_dictionary_entries[_id].ref = textNode
  //       textNode.nodeValue = obs_dictionary_entries[_id][settings.currentLang]
  //     }
  //   }

  //   // placeholders and titles
  //   document.querySelectorAll('[placeholder], [title]').forEach(element => {
  //     let attrs = element.attributes

  //     for(let i = 0; i < attrs.length; i++) {
  //       if(attribs.indexOf(attrs[i].nodeName.toLowerCase()) != -1) {
  //         let _nodeId = nodeId(attrs[i])
  //         if(obs_dictionary_entries && obs_dictionary_entries[_nodeId]) {
  //           obs_dictionary_entries[_nodeId].ref = attrs[i]
  //           attrs[i].nodeValue = obs_dictionary_entries[_nodeId][settings.currentLang]
  //         }
  //       }
  //     }
  //   })
  // }, 100)
}
