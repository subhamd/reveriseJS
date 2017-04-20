import objectAssign from 'object-assign'
import { objForEach, now } from './utils'
import MutationObserver from 'mutation-observer'
import { nodeId, nodePos, nodeIdPos, absNodePos, dictKey, normalizedLocation } from './keygen'
import { nodeWalker } from './walker'

let observer            = null,
    new_nodes           = {},
    intervalId          = null,
    submitted_node_ids  = null,
    processed_attrs     = {},
    processed_nodes     = {};

window.revlocalise = window.revlocalise || {}
window.revlocalise.showNewNodes = function() { console.log(new_nodes) }

let scanned_elements = {}

// mutation observer
export default function (obs_dictionary_entries, settings, _submitted_node_ids, service) {
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

          let _nodePos = absNodePos(node),
              _nodeId = null;


          // if this node is already translated before 
          if(
            obs_dictionary_entries &&
            processed_nodes[_nodePos] && 
            processed_nodes[_nodePos].updatedOn < now() &&
            obs_dictionary_entries[processed_nodes[_nodePos].originalId][settings.currentLang] === node.nodeValue
            ) {
            // console.log("Rejected the node: " + _nodePos + " current value : " + obs_dictionary_entries[processed_nodes[_nodePos].originalId][settings.currentLang] + 
            //   " original value : " + node.nodeValue)
            return;
          }
          
          _nodeId = nodeId(node);
          if(!_nodeId) return

          if(
            node.nodeType === 3 &&
            submitted_node_ids && 
            !submitted_node_ids[_nodeId] &&
            !processed_nodes[_nodePos]
            ) {
            if(node.nodeValue.trim() != "") {
              new_nodes[_nodeId] = node
            }
          }
          
          // translate new text node
          if(obs_dictionary_entries && node.nodeType === 3 && obs_dictionary_entries[_nodeId]) {
            processed_nodes[_nodePos] = { updatedOn: now(), originalId: _nodeId, ref: node }
            obs_dictionary_entries[_nodeId].ref = node
            node.nodeValue = obs_dictionary_entries[_nodeId][settings.currentLang]
          }
          
          // if element node 
          if(node.nodeType === 1) {
            // process text nodes 
            // search through children subtree
            nodeWalker(node, n => {
              let _nPos = absNodePos(n),
                  _nId = null;

              // if this node is already translated before 
              if(
                obs_dictionary_entries &&
                processed_nodes[_nPos] && 
                processed_nodes[_nPos].updatedOn < now() &&
                obs_dictionary_entries[processed_nodes[_nPos].originalId][settings.currentLang] === n.nodeValue
                ) {
                // console.log("Rejected the node: " + _nPos + " current value : " + obs_dictionary_entries[processed_nodes[_nPos].originalId][settings.currentLang] + 
                //   " original value : " + n.nodeValue)
                return;
              }

              _nId = nodeId(n)
              if(!_nId) return

              // new node
              if(
                n.nodeType === 3 &&
                n.nodeValue.trim() !== "" &&
                submitted_node_ids && 
                !submitted_node_ids[_nId] &&
                !processed_nodes[_nPos]
                ) {
                new_nodes[_nId] = n
              }

              // process text nodes
              if(obs_dictionary_entries && obs_dictionary_entries[_nId]) {
                processed_nodes[_nPos] = { updatedOn: now(), originalId: _nId, ref: n }
                obs_dictionary_entries[_nId].ref = n
                obs_dictionary_entries[_nId].ref.nodeValue = obs_dictionary_entries[_nId][settings.currentLang]
              }
            })

            // search attributes of the newly inserted nodes' subtree
            node.querySelectorAll('[placeholder], [title]').forEach(element => {
              let attrs = element.attributes
              // for each attribute
              for(let i = 0; i < attrs.length; i++) {
                if(attribs.indexOf(attrs[i].nodeName.toLowerCase()) != -1) {

                  let _attrPos = absNodePos(attrs[i]),
                      _attrId = null;
                  
                  // encountered before and already translated
                  if(
                    obs_dictionary_entries &&
                    processed_attrs[_attrPos] && 
                    processed_attrs[_attrPos].updatedOn < now() &&
                    attrs[i].nodeValue === obs_dictionary_entries[processed_attrs[_attrPos].originalId][settings.currentLang]) {
                      return
                  }

                  _attrId = nodeId(attrs[i])
                  if(!_attrId) return

                  // detect new attributes 
                  if(
                    submitted_node_ids && 
                    !submitted_node_ids[_attrId] && 
                    !processed_attrs[_attrPos] &&
                    attrs[i].nodeValue.trim() != ""
                    ) {
                      new_nodes[_attrId] = attrs[i]
                  }

                  // translate attributes
                  if(obs_dictionary_entries && obs_dictionary_entries[_attrId]) {
                    processed_attrs[_attrPos] = { updatedOn: now(), originalId: _attrId, ref: attrs[i] } //keep track of processed attributes
                    obs_dictionary_entries[_attrId].ref = attrs[i]
                    attrs[i].nodeValue = obs_dictionary_entries[_attrId][settings.currentLang]
                  }
                }
              }
            })

          }

        })
      }
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
        service.submit(req_data).then(response => {
          new_nodes = {}
          submitted_node_ids = response.ids //store the new ids 

          console.log("A set of new nodes were submitted.")
          console.log(response)
          // storage will be updated on next reload
        })
        .catch(err => {
          console.log('Pushing new strings failed!')
        })
      }
      else {
        console.log("No new nodes discovered.")
      }

    }, 5000)
  }

  return {
    processed_nodes,
    processed_attrs
  }
}
