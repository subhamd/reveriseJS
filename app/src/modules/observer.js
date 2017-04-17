import MutationObserver from 'mutation-observer'
import { nodeId, nodePos, dictKey } from './keygen'

let observer = null,
    submitted_entry_ids = null

export function updateSubmittedEntryIds(new_ids) {
  submitted_entry_ids = new_ids
}


// mutation observer
export default function(obs_dictionary_entries, settings, all_submitted_entry_ids) {
  let attribs = ['placeholder', 'title'],
      submitted_entry_ids = all_submitted_entry_ids

  // if called multiple times, stop the previous observer
  if(observer) observer.disconnect()

  // install mutation observer
  observer = new MutationObserver(mutations => {
    mutations.forEach( mutation => {

      // handle newly inserted nodes
      if(mutation.type == 'childList') {
        mutation.addedNodes.forEach(node => {
          let _nodeId = nodeId(node)
          if(obs_dictionary_entries && obs_dictionary_entries[_nodeId]) {
            obs_dictionary_entries[_nodeId].ref = node
            node.nodeValue = obs_dictionary_entries[_nodeId][settings.currentLang]
          }
          if(obs_dictionary_entries && !obs_dictionary_entries[_nodeId]) {
            // possible new string found
            // send to backend or batch for later processing
            // check in the unpublished ids array to see if this is a new string
            // if so send to backend after a couple minutes
          }
        })
      }

      //
      if(mutation.type == 'attributes' && ( attribs.indexOf( mutation.attributeName ) != -1 ) ) {
        let attr = mutation.target.attributes[ mutation.attributeName ],
            old_val = mutation.oldValue,
            _nodeId = nodeId(attr)
        if(obs_dictionary_entries && obs_dictionary_entries[_nodeId]) {
          obs_dictionary_entries[_nodeId].ref = attr
          if(old_val !== obs_dictionary_entries[ _nodeId ][ settings.currentLang ])
            attr.nodeValue = obs_dictionary_entries[ _nodeId ][ settings.currentLang ]
        }
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

  // add title ref -> title is not observed
  setTimeout(() => {
    let title = document.querySelector('title')
    if(title) {
      let textNode = title.childNodes[0],
      _id = nodeId(textNode)
      if(obs_dictionary_entries && obs_dictionary_entries[_id]) {
        obs_dictionary_entries[_id].ref = textNode
        textNode.nodeValue = obs_dictionary_entries[_id][settings.currentLang]
      }
    }

    // placeholders and titles
    document.querySelectorAll('[placeholder], [title]').forEach(element => {
      let attrs = element.attributes

      for(let i = 0; i < attrs.length; i++) {
        if(attribs.indexOf(attrs[i].nodeName.toLowerCase()) != -1) {
          let _nodeId = nodeId(attrs[i])
          if(obs_dictionary_entries && obs_dictionary_entries[_nodeId]) {
            obs_dictionary_entries[_nodeId].ref = attrs[i]
            attrs[i].nodeValue = obs_dictionary_entries[_nodeId][settings.currentLang]
          }
        }
      }
    })

  }, 100)
}
